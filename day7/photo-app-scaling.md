# SnapShare Scaling Plan

## 1. Assumption and DAU

- Registered users: 10 million
- Daily active users (DAU): 10% of registered users = 1 million users
- Each user uploads 1 photo each day
- Each user opens 50 feed pages each day
- Each original photo is 2 MB
- Each thumbnail is 50 KB (0.05 MB)
- We spread traffic across 86,400 seconds in a day
- This plan is an estimate. Real traffic will have peaks.
- These numbers do not include backups, replicas, or extra thumbnail sizes.

### Uploads per second

`1,000,000 uploads/day ÷ 86,400 seconds/day ≈ 11.6 uploads/second on average`

### Feed views per second

`1,000,000 DAU × 50 feed pages/day ÷ 86,400 seconds/day ≈ 579 feed page views/second on average`

This is the number of feed page requests, not the number of photo clicks. The real number of image requests depends on how many photos appear on each page. Peak traffic will be much higher than the daily average.

### Photo storage per year

`1,000,000 uploads/day × 365 days × (2 MB + 0.05 MB) = 748,250,000 MB/year`

That is about 748 TB, or 0.75 PB, of new photo data each year. This includes one thumbnail for each original photo.

## 2. Is this read-heavy or write-heavy?

SnapShare is a read-heavy system.

Each active user opens 50 feed pages for every one photo upload. That means reads happen much more often than writes. The system should scale the read path well. It should use a cache, read replicas, and a CDN so repeated requests do not hit the main database or object storage every time.

## 3. Architecture

```text
                  +-------------------+
                  |   Web / Mobile    |
                  +--+-------------+--+
                     |             |
         Feed/API     |             | Photo bytes (presigned URL)
                     v             v
              +---------------+  +----------------+
              | Load Balancer |  | Object Storage |
              +-------+-------+  | originals and  |
                      |          | thumbnails     |
                      v          +---+---------+--+
              +---------------+      |         ^
              | App Servers   |      |         | thumbnail files
              +--+---------+--+      v         |
                 |         |      +-------+  +--+----------+
                 |         |      | Queue |->| Thumbnail  |
                 |         |      +-------+  | Worker     |
                 |         |                 +--+----------+
                 |         |                    |
                 v         v                    | job result/status
           +------------------+  replication  +------------------+
           | Database Primary |-------------> | Database Read    |
           | writes/metadata  |               | Replica          |
           +------------------+               +------------------+

Image delivery: Web / Mobile <----> CDN <---- cache miss ----> Object Storage
```

## 4. Main parts of the system

- Web/mobile app: Users upload photos and view the feed. The app also shows the image URLs returned by the service.
- CDN: Keeps photo files close to users and reduces delay and traffic to the main storage.
- Load balancer: Sends traffic across many app servers so the service can grow horizontally.
- App servers: Check requests, build feeds, save photo metadata, and allow user uploads.
- Cache: Stores popular feed and metadata results so reads are fast.
- Database primary: Stores the real data for users, follows, photo metadata, and upload status. This is where writes happen.
- Database read replica: Handles read requests and reduces work on the main database.
- Object storage: Stores original photos and small resized thumbnails. Large binary files are kept here instead of inside the database.
- Queue: Saves thumbnail jobs so a burst of uploads does not slow down image processing.
- Thumbnail worker: Reads queued jobs, creates thumbnails, stores them in object storage, and marks the photo as ready.

## 5. Photo upload flow

1. The app asks an app server to start an upload. The server checks the user, validates the request, creates a pending photo record, and picks an object key.
2. The app server sends a short-lived presigned URL so the app can upload the photo directly to object storage.
3. The app uploads the original photo to object storage. This keeps large file transfer off the app servers.
4. Object storage sends an upload event, or the app calls a completion endpoint to confirm the file was saved. Then the app server adds a thumbnail job with the photo ID and object key.
5. A thumbnail worker reads the job, opens the original image, checks it, resizes it, and saves a 50 KB thumbnail to object storage.
6. The worker updates the photo status in the database. If there is a retryable error, it retries. If the error keeps happening, it is flagged for investigation.
7. The feed can show the photo when it is ready. It returns a CDN URL for the thumbnail, and the CDN fetches the file from storage when needed.

## 6. Trade-offs

- Direct upload to object storage vs. sending files through app servers: Direct upload saves app-server bandwidth and scales better for large files, but it needs careful permission rules and reliable completion handling.
- Async thumbnails vs. sync processing: A queue helps the system handle upload bursts, but the photo may not be ready immediately. The app must support pending and failed states.


## 7. Summary

SnapShare is mostly a read-heavy photo app. The main idea is to separate upload work from read work. The app should upload photos directly to object storage, process thumbnails in the background, cache feed content, and use a CDN to serve images fast.

This design helps the service handle millions of users while keeping the database and app servers from becoming bottlenecks.
