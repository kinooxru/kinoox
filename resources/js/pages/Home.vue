<template>
  <AppLayout>
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Добро пожаловать в KINOOX</h1>
          <p class="hero-subtitle">Смотрите фильмы, сериалы, мультфильмы и аниме в лучшем качестве</p>
          <div class="hero-actions">
            <button class="btn btn-primary">Смотреть сейчас</button>
          </div>
        </div>
      </section>

      <!-- Popular Titles -->
      <section class="popular-section">
        <h2 class="section-title">Популярное</h2>
        <div class="titles-grid">
          <div class="title-card" v-for="n in 8" :key="n">
            <div class="title-poster">
              <div class="placeholder-poster">Постер</div>
            </div>
            <div class="title-info">
              <h3 class="title-name">Название фильма</h3>
              <p class="title-meta">2024 • Боевик</p>
              <div class="title-rating">
                <span class="rating kp">8.5</span>
                <span class="rating imdb">7.9</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- New Releases -->
      <section class="new-section">
        <h2 class="section-title">Новинки</h2>
        <div class="titles-grid">
          <div class="title-card" v-for="n in 8" :key="n">
            <div class="title-poster">
              <div class="placeholder-poster">Постер</div>
            </div>
            <div class="title-info">
              <h3 class="title-name">Новый фильм</h3>
              <p class="title-meta">2024 • Драма</p>
              <div class="title-rating">
                <span class="rating kp">8.2</span>
                <span class="rating imdb">7.5</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from '@/layouts/AppLayout.vue';
</script>

<style scoped>
.home-page {
  padding-bottom: 3rem;
}

.hero {
  height: 60vh;
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)),
    url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"%3E%3Crect fill="%231a1a2e" width="1920" height="1080"/%3E%3C/svg%3E');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-top: -5rem;
}

.hero-content {
  max-width: 800px;
  padding: 2rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #e5e5e5;
  margin-bottom: 2rem;
}

.btn-primary {
  background: #e50914;
  color: #fff;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #f40612;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1.5rem;
}

.popular-section,
.new-section {
  margin-bottom: 3rem;
}

.titles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.title-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.title-card:hover {
  transform: translateY(-5px);
}

.title-poster {
  aspect-ratio: 2/3;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.placeholder-poster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #808080;
  font-size: 0.9rem;
}

.title-info {
  padding: 0 0.25rem;
}

.title-name {
  font-size: 1rem;
  font-weight: 500;
  color: #fff;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-meta {
  font-size: 0.85rem;
  color: #808080;
  margin-bottom: 0.5rem;
}

.title-rating {
  display: flex;
  gap: 0.5rem;
}

.rating {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.rating.kp {
  background: #008000;
  color: #fff;
}

.rating.imdb {
  background: #f5c518;
  color: #000;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .titles-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
}
</style>
