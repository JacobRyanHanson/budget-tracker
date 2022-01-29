let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function (event) {
    // Saves a reference to the database .
    const db = event.target.result;
    // Creates an object store (table) called `new_budget`, set it to have an auto incrementing primary key of sorts. 
    db.createObjectStore('new_budget', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // When db is successfully created with its object store (from onupgradedneeded event above) or simply established 
    // a connection, save reference to db in global variable.
    db = event.target.result;

    // Checks if app is online, if yes run uploadbudget() function to send all local db data to api.
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    // Opens a new transaction with the database with read and write permissions. 
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // Access the object store for `new_budget`.
    const budgetObjectStore = transaction.objectStore('new_budget');

    // Add record to your store with add method.
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // Opens a transaction on your db.
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // Access your object store.
    const budgetObjectStore = transaction.objectStore('new_budget');

    // Gets all records from store and set to a variable.
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // If there was data in indexedDb's store, let's send it to the api server.
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // Open one more transaction.
                    const transaction = db.transaction(['new_budget'], 'readwrite');
                    // Access the new_budget object store.
                    const budgetObjectStore = transaction.objectStore('new_budget');
                    // Clears all items in your store.
                    budgetObjectStore.clear();

                    alert('All saved transaction(s) have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadBudget);