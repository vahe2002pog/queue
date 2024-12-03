import {
    addToQueue,
    getQueueData,
    removeFromQueue,
    checkAuth,
    isInQueue,
    getQueueLength,
    getFormattedQueue,
    isAuth,
    user,
    queue,
    loading,
    error,
    queueLength,
    formattedQueue,

} from './functions.js';

const loginButton = document.getElementById('login-button');
const addToQueueButton = document.getElementById('add-to-queue-button');
const removeFromQueueButton = document.getElementById('remove-from-queue-button');
const queueList = document.getElementById('queue-list');
const queueLengthDisplay = document.getElementById('queue-length');
const authStatus = document.getElementById('auth-status');
const queueContainer = document.getElementById('queue-container');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');


const updateUI = () => {
    queueList.innerHTML = '';
    getFormattedQueue().forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `User ID: ${item.user_id}, Timestamp: ${item.timestamp}`;
        queueList.appendChild(listItem);
    });
    queueLengthDisplay.textContent = getQueueLength();

    addToQueueButton.disabled = loading || isInQueue();
    removeFromQueueButton.disabled = loading || !isInQueue();

    loadingIndicator.style.display = loading ? 'block' : 'none';
    errorMessage.textContent = error || '';

    authStatus.textContent = isAuth ? `Logged in as User ID: ${user?.id}` : 'Not logged in';
    queueContainer.style.display = isAuth ? 'block' : 'none';
};

// Initialize UI updates
isAuth.subscribe(updateUI);
user.subscribe(updateUI);
queue.subscribe(updateUI);
loading.subscribe(updateUI);
error.subscribe(updateUI);
isInQueue.subscribe(updateUI);
queueLength.subscribe(updateUI);
formattedQueue.subscribe(updateUI);

loginButton.addEventListener('click', () => {
    window.location.href = '/login'; // Redirect to your login endpoint
});

addToQueueButton.addEventListener('click', addToQueue);
removeFromQueueButton.addEventListener('click', removeFromQueue);

checkAuth();
getQueueData(); // Initial queue load