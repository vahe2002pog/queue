import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Замените на ваш URL

// Авторизация
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    throw error;
  }
};

export const register = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, { username, password });
    return response.data;
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    throw error;
  }
};

// Работа с очередями
export const createQueue = async (queueName) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.post(`${API_URL}/queues`, { queueName }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка создания очереди:', error);
    throw error;
  }
};

export const joinQueue = async (queueId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.post(`${API_URL}/queues/${queueId}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка присоединения к очереди:', error);
    throw error;
  }
};

export const leaveQueue = async (queueId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.post(`${API_URL}/queues/${queueId}/leave`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка выхода из очереди:', error);
    throw error;
  }
};

// Получение данных о очереди
export const getQueue = async (queueId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`${API_URL}/queues/${queueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка получения данных очереди:', error);
    throw error;
  }
};
