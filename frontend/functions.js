const russianMonths = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
    "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];

let isAuth = false;
let user = null;
let queue = [];
let myQueueId = null;
let loading = false;
let error = null;

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
            const errorData = await response.json().catch(() => ({ error: 'Ошибка сети' }));
            throw new Error(`HTTP error! status: ${response.status}, ${JSON.stringify(errorData)}`);
        }
        return await response.json();
    } catch (err) {
        error = err.message;
        console.error('Request error:', err);
    } finally {
        loading = false;
    }
}

export async function addToQueue() {
    try {
        const { queue_id } = await request('/api/queue', 'POST', { user_id: user.id });
        myQueueId = queue_id;
        await getQueueData();
    } catch (e) {
        console.error("Ошибка добавления в очередь", e);
    }
}

export async function getQueueData() {
    try {
        queue = (await request('/api/queue')).data; // Assuming your API returns data in a 'data' field
    } catch (e) {
        console.error("Ошибка получения очереди", e);
    }
}

export async function removeFromQueue() {
    try {
        if (!myQueueId) return;
        await request(`/api/queue/${myQueueId}`, 'DELETE');
        myQueueId = null;
        await getQueueData();
    } catch (e) {
        console.error("Ошибка удаления из очереди", e);
    }
}

export async function checkAuth() {
    try {
        const { auth, data } = await request('/api/authcheck'); // Assuming your API returns user data in a 'data' field
        isAuth = auth;
        if (auth) {
            user = data; // Assuming your API returns user data in a 'data' field
        }
    } catch (e) {
        console.error("Ошибка проверки авторизации", e);
    }
}

export async function getUser() {
  try {
    const { data } = await request('/api/user'); // Adjust path if needed
    user = data;
  } catch (e) {
    console.error("Ошибка получения данных пользователя", e);
  }
}

export function isInQueue() {
    return user && queue.some(item => item.user_id === user.id);
}

export function getQueueLength() {
    return queue.length;
}


export function getFormattedQueue() {
    return queue.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleString()
    }));
}