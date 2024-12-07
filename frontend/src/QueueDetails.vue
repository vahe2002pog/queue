<template>
    <div>
        <h1>{{ queue.name }}</h1>
        <ul>
            <li v-for="member in queue.members" :key="member.id">
                Пользователь {{ member.user_id }}
                <button @click="swapPlaces(member.id)">Поменяться местами</button>
            </li>
        </ul>
        <button @click="leaveQueue">Покинуть очередь</button>
    </div>
</template>

<script>
import api from '../api';

export default {
    props: ['queueId'],
    data() {
        return {
            queue: { name: '', members: [] },
        };
    },
    methods: {
        async fetchQueue() {
            const response = await api.getQueues();
            this.queue = response.data.data.find((q) => q.id === this.queueId);
        },
        async leaveQueue() {
            const userId = prompt('Введите ваш ID:');
            if (userId) {
                await api.leaveQueue(this.queueId, userId);
                alert('Вы покинули очередь.');
            }
        },
        async swapPlaces(targetEntryId) {
            const userId = prompt('Введите ваш ID:');
            if (userId) {
                await api.swapTurns(this.queueId, userId, targetEntryId);
                alert('Запрос на обмен отправлен.');
            }
        },
    },
    created() {
        this.fetchQueue();
    },
};
</script>