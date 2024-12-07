<template>
    <div class="queue-page">
      <h1>Очередь: {{ queueName }}</h1>
      <ul>
        <li v-for="(user, index) in participants" :key="index">{{ user }}</li>
      </ul>
      <div class="actions">
        <button @click="join">Присоединиться</button>
        <button @click="leave">Выйти</button>
      </div>
    </div>
  </template>
  
  <script>
  import { getQueue, joinQueue, leaveQueue } from '../services/api';
  
  export default {
    name: 'QueuePage',
    data() {
      return {
        queueName: '',
        participants: [],
      };
    },
    async mounted() {
      try {
        const queueData = await getQueue(this.$route.params.queueId);
        this.queueName = queueData.name;
        this.participants = queueData.participants;
      } catch (error) {
        alert('Ошибка загрузки данных очереди.');
      }
    },
    methods: {
      async join() {
        try {
          await joinQueue(this.$route.params.queueId);
          alert('Вы успешно добавлены в очередь.');
          this.refreshQueue();
        } catch (error) {
          alert('Ошибка присоединения.');
        }
      },
      async leave() {
        try {
          await leaveQueue(this.$route.params.queueId);
          alert('Вы вышли из очереди.');
          this.refreshQueue();
        } catch (error) {
          alert('Ошибка выхода.');
        }
      },
      async refreshQueue() {
        const queueData = await getQueue(this.$route.params.queueId);
        this.participants = queueData.participants;
      },
    },
  };
  </script>
  