<template>
    <div class="login-page">
      <h1>Вход</h1>
      <form @submit.prevent="handleLogin">
        <input v-model="username" placeholder="Имя пользователя" required />
        <input v-model="password" type="password" placeholder="Пароль" required />
        <button type="submit">Войти</button>
      </form>
      <p>
        Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </div>
  </template>
  
  <script>
  import { login } from '../services/api';
  
  export default {
    name: 'myLogin',
    data() {
      return {
        username: '',
        password: '',
      };
    },
    methods: {
      async handleLogin() {
        try {
          await login(this.username, this.password);
          this.$router.push('/'); // После входа перенаправляем на главную
        } catch (error) {
          alert('Ошибка входа. Проверьте данные.');
        }
      },
    },
  };
  </script>