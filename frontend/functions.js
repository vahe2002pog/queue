// Enhanced JavaScript Frontend Functions for Queue Management

const russianMonths = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];

let isAuth = false;
let user = null;
let queues = [];
let activeQueueId = null;
let myQueueEntryId = null;
let loading = false;
let error = null;
const eventSource = new EventSource('/api/queue/updates'); // Real-time updates with Server-Sent Events

function getCookie(key) {
    const cookies = document.cookie.split('; ');
    const cookieKey = `${key}=`;
    const cookie = cookies.find(c => c.startsWith(cookieKey));
    return cookie ? cookie.substring(cookieKey.length) : undefined;
}

async function request(url, method = 'GET', body = null, accept = 'application/json', contentType = 'application/json') {
    loading = true;
    error = null;
    const token = getCookie('token');
    const headers = {
        Authorization: `Bearer ${token || ''}`,
        Accept: accept,
        'Content-Type': contentType
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (err) {
        error = err.message;
        console.error(err);
    } finally {
        loading = false;
    }
}

async function fetchQueues() {
    const data = await request('/api/queues');
    if (data) {
        queues = data.data || [];
        renderQueues();
    }
}

async function createQueue(queueName) {
    const data = await request('/api/queues', 'POST', { name: queueName });
    if (data && data.data) {
        activeQueueId = data.data.queue_id;
        await fetchQueues();
    }
}

async function joinQueue(queueId) {
    const data = await request(`/api/queues/${queueId}/join`, 'POST');
    if (data && data.data) {
        myQueueEntryId = data.data.entry_id;
        activeQueueId = queueId;
        await fetchQueues();
    }
}

async function leaveQueue() {
    if (!myQueueEntryId) return;
    const data = await request(`/api/queues/${activeQueueId}/leave`, 'DELETE');
    if (data && data.data) {
        myQueueEntryId = null;
        activeQueueId = null;
        await fetchQueues();
    }
}

async function skipTurn() {
    if (!myQueueEntryId) return;
    const data = await request(`/api/queues/${activeQueueId}/skip`, 'POST');
    if (data && data.data) {
        await fetchQueues();
    }
}

async function requestSwap(targetEntryId) {
    const data = await request(`/api/queues/${activeQueueId}/swap`, 'POST', { target_entry_id: targetEntryId });
    if (data && data.data) {
        await fetchQueues();
    }
}

function handleRealTimeUpdates(event) {
    const update = JSON.parse(event.data);
    if (update.queueId === activeQueueId) {
        fetchQueues();
    }
}

eventSource.addEventListener('message', handleRealTimeUpdates);

function renderQueues() {
    const queuesContainer = document.getElementById('queues');
    queuesContainer.innerHTML = '';
    queues.forEach(queue => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.textContent = `Queue: ${queue.name} (${queue.members.length} members)`;
        queueItem.addEventListener('click', () => joinQueue(queue.id));
        queuesContainer.appendChild(queueItem);
    });
}

function renderQueueDetails(queue) {
    const queueContainer = document.getElementById('queueDetails');
    queueContainer.innerHTML = '';
    queue.members.forEach((member, index) => {
        const date = new Date(member.timestamp);
        const formattedDate = `${date.getDate()} ${russianMonths[date.getMonth()]} ${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.textContent = `#${index + 1} User: ${member.user_id}, Time: ${formattedDate}`;

        if (member.user_id === user.id) {
            const skipButton = document.createElement('button');
            skipButton.textContent = 'Skip';
            skipButton.addEventListener('click', skipTurn);

            const leaveButton = document.createElement('button');
            leaveButton.textContent = 'Leave';
            leaveButton.addEventListener('click', leaveQueue);

            memberItem.appendChild(skipButton);
            memberItem.appendChild(leaveButton);
        } else {
            const swapButton = document.createElement('button');
            swapButton.textContent = 'Request Swap';
            swapButton.addEventListener('click', () => requestSwap(member.entry_id));
            memberItem.appendChild(swapButton);
        }

        queueContainer.appendChild(memberItem);
    });
}

function setupEventListeners() {
    document.getElementById('createQueue').addEventListener('click', async () => {
        const queueName = prompt('Enter queue name:');
        if (queueName) {
            await createQueue(queueName);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchQueues();
    setupEventListeners();
});