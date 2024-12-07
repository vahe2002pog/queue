<template>
    <div class="home-page">
        <h1>Добро пожаловать в Систему Очередей</h1>
        <div class="actions">
            <button @click="navigateToQueue">Создать очередь</button>
            <button @click="joinQueue">Присоединиться к очереди</button>
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
    name: 'HomePage',
    setup() {
        const router = useRouter();

        const navigateToQueue = () => {
            // Перейти на страницу очереди
            router.push('/queue');
        };

        const joinQueue = () => {
            const queueId = prompt('Введите ID очереди:');
            if (queueId) {
                router.push(`/queue/${queueId}`);
            }
        };

        return {
            navigateToQueue,
            joinQueue,
        };
    },
};
</script>

<style scoped>
.home-page {
    text-align: center;
    margin-top: 50px;
}

.actions {
    margin-top: 20px;
}

button {
    margin: 10px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
}
</style>