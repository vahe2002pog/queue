<template>
    <div id="app">
        <header>
            <h1>Онлайн-очередь</h1>
        </header>
        <main>
            <router-view /> <!-- Здесь будет отображаться контент в зависимости от маршрута -->
        </main>
        <footer>
            <p>© 2024 Онлайн-очередь</p>
        </footer>
    </div>
</template>

<script>
export default {
    name: "App",
};
</script>

<style>
/* Пример стилизации */
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin: 0;
    padding: 0;
}

header {
    background-color: #42b983;
    color: white;
    padding: 1rem;
}

footer {
    background-color: #2c3e50;
    color: white;
    padding: 0.5rem;
    position: fixed;
    bottom: 0;
    width: 100%;
}

main {
    padding: 2rem;
    min-height: calc(100vh - 140px);
    /* Учитываем высоту header и footer */
}
</style>