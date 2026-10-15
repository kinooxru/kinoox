<template>
  <div class="app-layout">
    <!-- Header / Navigation -->
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <h1>KINOOX</h1>
        </div>
        <div class="nav-links">
          <a href="/" class="nav-link">Главная</a>
          <a href="/titles" class="nav-link">Фильмы</a>
          <a href="/titles?type=serial" class="nav-link">Сериалы</a>
          <a href="/titles?type=cartoon" class="nav-link">Мультфильмы</a>
          <a href="/titles?type=anime" class="nav-link">Аниме</a>
        </div>
        <div class="nav-actions">
          <button class="btn btn-secondary">Войти</button>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="main">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2024 KINOOX. Все права защищены.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Базовый layout для основного приложения
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-brand h1 {
  color: #e50914;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #e5e5e5;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #fff;
}

.nav-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-secondary {
  background: transparent;
  color: #e5e5e5;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main {
  flex: 1;
  padding: 5rem 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.footer {
  background: #0a0a0a;
  padding: 2rem;
  text-align: center;
  color: #808080;
  margin-top: auto;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
