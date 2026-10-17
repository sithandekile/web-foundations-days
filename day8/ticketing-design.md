# TicketHub Design

TicketHub sells seats for concerts and other live events. The main goal is to keep ticket inventory correct while still keeping the site easy to use.

## 1. Requirements

### Functional requirements

- Visitors can browse events, search for events, and view details like prices and seat maps.
- A visitor can choose an available seat and place a temporary hold before paying.
- A customer can pay for a held seat, get an order confirmation, and view their tickets.
- Customers can check order and payment status. Staff can cancel an order and release the seats if policy allows.
- The system stops one customer from holding too many seats and stops one seat from being sold twice.

### Non-functional requirements

- Speed: Event pages should load in under 300 milliseconds during normal traffic. Seat checks and holds should happen in under 1 second during a sale, not counting waiting room time or payment provider time.
- Correctness: The database is the source of truth for seat availability. The system should not say a seat is held or sold until the database confirms it. Payment and purchase requests must be safe to retry.
- Fairness: During a busy sale, users enter a virtual waiting room and get a signed queue token. They cannot get ahead by refreshing. The system allows only one active hold per seat and limits buys per user. Bot checks must not let users skip the line.
- Availability and recovery: Event browsing should still work if a read-only database fails. If the inventory database cannot confirm a seat, the system should fail safely instead of guessing.
- Security: Customers must sign in for holds and purchases. Every order and ticket lookup must be checked. Queue tokens must be valid. TicketHub must not store payment card data.

## 2. Traffic estimates

These numbers are daily averages unless we say they are for a sale window. Real traffic can spike higher, so the system needs extra capacity and queue control.

### Normal day

- Registered users: 2 million.
- Visitors: 50,000 per day, or about 2,083 per hour if spread evenly.
- Page views: 50,000 visitors × 10 pages = 500,000 page views per day.
- Average page-view rate: 500,000 ÷ 86,400 seconds ≈ 5.8 page views per second.
- Ticket sales: 5,000 per day, or 5,000 ÷ 86,400 ≈ 0.058 sales per second. That is about one sale every 17 seconds on average.

### Popular concert sale

- Demand: 200,000 people in 10 minutes for 20,000 seats.
- Average arrival rate: 200,000 ÷ 600 seconds ≈ 333 people per second.
- Demand is 10 people per seat. At most 10% of those people can buy one seat.
- For a simple estimate, assume each person makes one event or seat-map read and one hold request: 333 × 2 ≈ 667 requests per second. If each person also loads one event page through the API, the total is about 1,000 API requests per second before retries, payment calls, or bursts.
- If all 20,000 seats sell evenly in the sale window, completed sales average 20,000 ÷ 600 ≈ 33 sales per second. This is different from the number of attempts. Most attempts will either be told the seat is gone or kept in the waiting room.

The sale has about 333 visitors per second. That is about 58 times the normal page-view rate. The 1,000 API requests per second is about 173 times the normal page-view rate. These numbers are not exactly the same, but they show the same idea: the system must be tested under heavier loads than normal. The waiting room should slow traffic before it reaches the inventory system.

## 3. API

All endpoints use HTTPS. Customer-specific endpoints require login. Mutating requests accept an `Idempotency-Key`. Every response includes a request ID for support and debugging.

| Method and endpoint | Purpose |
|---|---|
| `GET /v1/events?query=&date=&cursor=` | Search and browse events. Returns a list of event summaries. |
| `GET /v1/events/{eventId}` | View event details, venue info, sale status, and price bands. |
| `GET /v1/events/{eventId}/seats?section=` | Get a seat map and live availability snapshot. This snapshot is only a guide. A committed hold is the real guarantee. |
| `POST /v1/events/{eventId}/holds` | Hold one or more seat IDs using a valid queue token. Returns an order or hold ID and expiry time, or a conflict if a seat was already taken. |
| `POST /v1/orders/{orderId}/payment-intent` | Start payment for the order. Returns a checkout link or payment reference. |
| `POST /v1/orders/{orderId}/confirm` | Confirm the payment result or fetch the current order status. Repeated calls return the same result. |
| `GET /v1/me/tickets?cursor=` | List a logged-in customer's paid tickets and event details. |
| `GET /v1/me/orders/{orderId}` | View an order's status and seats. The server checks that the order belongs to the customer. |

The payment provider sends a signed webhook when the payment finishes. Webhook IDs are deduplicated, and a payment idempotency key stops duplicate charges. A seat map can become stale almost instantly. The hold endpoint is the real availability check.

## 4. Data model

We use a relational database for inventory and orders. Primary keys are UUIDs unless the data already has a natural key.

| Table | Important columns and rules |
|---|---|
| `users` | `id` PK, `email` UNIQUE, `created_at`. One user can place many orders. |
| `events` | `id` PK, `venue_name`, `title`, `starts_at`, `sale_opens_at`, `status`. One event has many seats and orders. |
| `seats` | `id` PK, `event_id` FK → `events.id`, `section`, `row_label`, `seat_number`, `price`; UNIQUE (`event_id`, `section`, `row_label`, `seat_number`). Also stores `state` (`available`, `held`, `sold`), nullable `hold_order_id`, `held_until`, and nullable `sold_order_id`. A rule says hold fields are only used for held seats, and sold order data is only used for sold seats. |
| `orders` | `id` PK, `user_id` FK → `users.id`, `event_id` FK → `events.id`, `status` (`pending`, `payment_pending`, `paid`, `cancelled`, `expired`), `total_amount`, `created_at`, `hold_expires_at`. One order belongs to one user and one event and contains one or more seats. |
| `order_items` | `id` PK, `order_id` FK → `orders.id`, `seat_id` FK → `seats.id`, `price_at_purchase`; UNIQUE (`order_id`, `seat_id`). Stores which seats were bought and what the price was. |
| `payments` | `id` PK, `order_id` FK → `orders.id`, `provider_reference` UNIQUE, `idempotency_key` UNIQUE, `amount`, `status`, `created_at`. One order can have many payment attempts, but only one successful capture is accepted. |

Relationships: `users` have many `orders`; `events` have many `seats` and many `orders`; `orders` have many `order_items` and many payment attempts; each `order_item` refers to one seat. The seat row is the true current state. The order items keep the purchase record.

## 5. Preventing double-booking

The app never decides seat availability from a cached seat map. To place a hold, the inventory service starts a database transaction, locks the seat rows, and checks that each seat belongs to the requested event and is either available or has an expired hold. It then creates the pending order and order items and changes the requested seats to `held`, with that order ID and a short expiry time, such as 5 minutes. It commits only after everything is valid.

If any requested seat is not available, the transaction rolls back. The customer does not get a partial set of seats.

The row lock makes sure only one transaction can change a seat from available to held at one time. A second safety check updates only rows where the seat is available or its hold is expired. The system also checks how many rows were changed. Database rules validate seat state and event identity. The whole reservation is either saved or not saved at all.

When payment is authorized, a transaction checks that the order still owns valid holds, marks the seats as `sold`, sets `sold_order_id`, and marks the order as paid. The payment capture is done idempotently with the payment provider. If payment fails, the system reconciles, voids, or refunds it rather than opening the seat based on uncertain data. Expired holds are released through the same locked update path, so a cleanup worker cannot overwrite a buyer who is making a real purchase. Retries use idempotency keys and return the same order instead of creating a duplicate.

## 6. Architecture

```text
       +-------------------+
       | Web / Mobile app  |
       +----+----------+---+
            |          |
     browse|          |buy / hold tickets
            v          v
      +----------+  +-------------------+
      |   CDN    |  | Virtual waiting   |
      | static & |  | room / token gate |
      | cached   |  +---------+---------+
      | catalog  |            |
      +----+-----+            | allowed users, rate limit
           |                  v
           |          +------------------+
           +--------->| Load balancer /  |
                      | API services     |
                      +---+----------+---+
                          |          |
                    reads |          | holds / orders
                          v          v
                   +-----------+  +------------------+
                   | Cache and |  | Inventory and    |
                   | read      |  | order service    |
                   | replica  |  +---+-----------+--+
                   +-----------+      |           |
                                      |           v
                                      |    +-------------+
                                      |    | Payment     |
                                      |    | provider    |
                                      |    +------+------+ 
                                      v           | webhook
                                +-----------------+--+
                                | Relational DB      |
                                | primary: seats,    |
                                | orders, payments   |
                                +--------------------+
```

- Web/mobile app and CDN: Deliver the app, static files, and cached event pages close to users. Seat availability is shown as a snapshot, not a guarantee.
- Virtual waiting room/token gate: Queues sale traffic, keeps ticket lines fair, limits active users and rate, and gives short-lived signed tokens. This keeps the origin server from being hit by all 200,000 users at once.
- Load balancer and API services: Spread browsing and order requests across servers. They validate login, queue tokens, input, and idempotency keys. Services can be scaled horizontally.
- Cache and read replica: Serve event descriptions and venue maps. Inventory writes and final hold checks go to the primary database, not the read copy.
- Inventory and order service: Manages seat state changes and the order lifecycle. Database locks and constraints stay authoritative even when many service instances handle requests.
- Relational database primary: Commits holds, sales, and payment state. Backups and monitoring help with recovery. If the database is down, sales pause rather than risking oversell.
- Payment provider: Handles payment data outside TicketHub. Signed webhooks and idempotent processing reconcile the provider result with the order.

The waiting room smooths the rush before it reaches the database. API scaling handles admitted traffic. Caching and read replicas take some load off browsing. The primary database still serializes the contested seat checks, which is necessary for correctness. We should monitor queue depth, entry rate, database lock waits, hold expiry, payment outcomes, and error rates. If inventory latency or errors rise, reduce the number of admitted users.

## 7. Trade-offs

- Strongly consistent inventory vs. maximum write throughput: Locking seat rows and writing to the primary database adds contention during a sale, but it stops two customers from being promised the same seat. Browsing can be only eventually consistent, but seat allocation cannot.
- Fair waiting room vs. instant access: A queue and queue tokens add waiting time and operational complexity, but they protect the service and keep the line fair instead of rewarding refresh speed.
- Temporary holds vs. customer convenience: Expiring holds prevent abandoned checkouts from blocking seats, but a slow payment can cause a hold to expire. Clear countdowns, a reasonable checkout window, and safe payment reconciliation reduce this risk.
- Cached browsing vs. freshness: Caching helps event pages handle large read spikes, but cached seat availability can become stale. The API makes that limitation clear and checks every hold against the database.
