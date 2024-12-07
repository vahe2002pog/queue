<template>
    <div>
        <h1>Очереди</h1>
        <ul>
            <li v-for="queue in queues" :key="queue.id">
                {{ queue.name }}
                <button @click="joinQueue(queue.id)">Присоединиться</button>
            </li>
        </ul>
        <input v-model="newQueueName" placeholder="Название очереди" />
        <button @click="createQueue">Создать очередь</button>
    </div>
</template>

<script>
import api from '../api';

export default {
    data() {
        return {
            queues: [],
            newQueueName: '',
        };
    },
    methods: {
        async fetchQueues() {
            const response = await api.getQueues();
            this.queues = response.data.data;
        },
        async createQueue() {
            if (this.newQueueName) {
                await api.createQueue(this.newQueueName);
                this.newQueueName = '';
                this.fetchQueues();
            }
        },
        async joinQueue(queueId) {
            const userId = prompt('Введите ваш ID:');
            if (userId) {
                await api.joinQueue(queueId, userId);
                alert('Вы присоединились к очереди!');
            }
        },
    },
    created() {
        this.fetchQueues();
    },
};
</script>