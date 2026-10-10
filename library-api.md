# Library API Overview

## What this code is doing

This JavaScript code loads a list of users from an external API, displays them on the page, and lets the user filter the list by name without making a new request.

## Main parts of the code

### 1. Store all users

- `let allUsers = [];` keeps the full list of users that was fetched.
- This is important because the app can filter the already loaded data instead of calling the API again.

### 2. Get DOM elements

- `document.getElementById("status")` gets the status message area.
- `document.getElementById("users-list")` gets the list container.
- `document.getElementById("user-filter")` gets the text input for filtering.
- `document.getElementById("load-btn")` gets the button that triggers the fetch.

### 3. Show status messages

- `setStatus(message, isError = false)` updates the `#status` element.
- If `isError` is `true`, the message is shown in red.
- Otherwise, it appears in green.

### 4. Render users to the page

- `renderUsers(list)` clears the current list and creates a new `<li>` for each user.
- `document.createElement("li")` creates a list item.
- `textContent` sets the visible text inside the element.
- The app displays:
  - user name
  - email
  - city
  - company name

### 5. Filter users without re-fetching

- `applyFilter()` reads the text typed into the filter box.
- It converts the text to lowercase using `.trim().toLowerCase()`.
- It checks whether each user name includes the typed text using:
  - `user.name.toLowerCase().includes(query)`
- This makes the filter case-insensitive.

### 6. Fetch users from the API

- `loadUsers()` uses `fetch("https://jsonplaceholder.typicode.com/users")`.
- `await` waits for the network request to finish.
- `res.ok` checks whether the server responded successfully.
- If the response is not OK, the code throws an error.

Example:

- `200 OK` means success
- `404` or `500` means failure

### 7. Handle success and error states

- On success:
  - store the data in `allUsers`
  - filter the list
  - show a success message in `#status`
- On error:
  - log the error to the console
  - show a failure message
  - display an empty list

### 8. Disable the button while loading

- `loadBtn.disabled = true` prevents the user from clicking the button repeatedly while the fetch is running.
- `finally` makes sure the button is enabled again after the request completes.

## Event listeners

- `loadBtn.addEventListener("click", loadUsers);`
  - runs the fetch when the button is clicked
- `filterInput.addEventListener("input", applyFilter);`
  - runs the filter every time the user types

## Why this is good practice

- The app fetches once and reuses the data.
- Filtering is done on the client side.
- The user sees loading, success, and error states.
- The button is disabled to prevent duplicate requests.
- The code uses safe checks like optional chaining (`user.address?.city`) to avoid errors if data is missing.

## Example flow

1. User clicks the Load Users button.
2. The button becomes disabled.
3. The app fetches the users from the API.
4. If the request succeeds, the list is stored and filtered.
5. The status message updates to show success.
6. The user types in the filter box.
7. Only matching names are displayed.
8. The app does not make a new request during filtering.

## Summary

This code demonstrates a common frontend pattern:

- fetch data from an API
- handle loading and errors
- render results
- filter the in-memory data
- keep the UI responsive and user-friendly
