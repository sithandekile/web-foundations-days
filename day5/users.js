
const statusEl = document.querySelector("#status");
const usersListEl = document.querySelector("#users-list");
const filterInput = document.querySelector("#filter-input");
const loadBtn = document.querySelector("#load-users");
let allUsers = [];

function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? "red" : "green";
}

function renderUsers(list) {
    if (!usersListEl) return;
    usersListEl.replaceChildren();

    list.forEach((user) => {
        const item = document.createElement("li");
        item.textContent =
            `${user.name} | ${user.email} | ${user.address?.city || "No city"} | ${user.company?.name || "No company"}`;
        usersListEl.appendChild(item);
    });
}

function filterUsers() {
    if (!filterInput) return;

    const query = filterInput.value.trim().toLowerCase();

    const filtered = allUsers.filter((user) =>
        user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );

    renderUsers(filtered);
}

async function loadUsers() {
    if (!loadBtn) return;

    loadBtn.disabled = true;
    setStatus("Loading users...");

    try {
        const res = await fetch("https://jsonplaceholder.typicode.com/users");

        if (!res.ok) {
            throw new Error(`Server responded with status ${res.status}`);
        }

        const data = await res.json();
        allUsers = data;

        filterUsers();
        setStatus(`Loaded ${data.length} users successfully.`);
    } catch (error) {
        console.error("Error fetching users:", error);
        setStatus("Failed to load users.", true);
        renderUsers([]);
    } finally {
        if (loadBtn) {
            loadBtn.disabled = false;
        }
    }
}

if (loadBtn) {
    loadBtn.addEventListener("click", loadUsers);
}

if (filterInput) {
    filterInput.addEventListener("input", filterUsers);
}