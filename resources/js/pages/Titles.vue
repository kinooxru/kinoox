<template>
  <AppLayout>
    <div class="titles-page">
      <div class="page-header">
        <h1 class="page-title">Каталог фильмов</h1>
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск фильмов..."
            class="search-input"
          />
        </div>
      </div>

      <div class="content">
        <!-- Filters -->
        <aside class="filters">
          <div class="filter-group">
            <h3 class="filter-title">Тип</h3>
            <label class="filter-label">
              <input type="checkbox" value="movie" v-model="filters.type" />
              Фильмы
            </label>
            <label class="filter-label">
              <input type="checkbox" value="serial" v-model="filters.type" />
              Сериалы
            </label>
            <label class="filter-label">
              <input type="checkbox" value="cartoon" v-model="filters.type" />
              Мультфильмы
            </label>
            <label class="filter-label">
              <input type="checkbox" value="anime" v-model="filters.type" />
              Аниме
            </label>
          </div>

          <div class="filter-group">
            <h3 class="filter-title">Год</h3>
            <select v-model="filters.year" class="filter-select">
              <option :value="null">Любой</option>
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>

          <div class="filter-group">
            <h3 class="filter-title">Сортировка</h3>
            <select v-model="filters.sort_by" class="filter-select">
              <option value="views_count">Популярность</option>
              <option value="rating_kp">Рейтинг Кинопоиск</option>
              <option value="rating_imdb">Рейтинг IMDb</option>
            </select>
          </div>
        </aside>

        <!-- Titles Grid -->
        <main class="main-content">
          <div class="titles-grid">
            <div class="title-card" v-for="title in titles" :key="title.id">
              <div class="title-poster">
                <img
                  v-if="title.poster_url"
                  :src="title.poster_url"
                  :alt="title.title"
                  class="poster-image"
                />
                <div v-else class="placeholder-poster">Нет постера</div>
              </div>
              <div class="title-info">
                <h3 class="title-name">{{ title.title }}</h3>
                <p class="title-meta">{{ title.year }} • {{ title.type }}</p>
                <div class="title-rating">
                  <span v-if="title.rating_kp" class="rating kp">
                    {{ title.rating_kp }}
                  </span>
                  <span v-if="title.rating_imdb" class="rating imdb">
                    {{ title.rating_imdb }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="loading">
            Загрузка...
          </div>

          <!-- Empty State -->
          <div v-if="!loading && titles.length === 0" class="empty">
            Ничего не найдено
          </div>

          <!-- Pagination -->
          <div v-if="!loading && titles.length > 0" class="pagination">
            <button
              :disabled="!pagination.prev_page_url"
              @click="loadPage(pagination.current_page - 1)"
              class="btn btn-pagination"
            >
              Назад
            </button>
            <span class="page-info">
              Страница {{ pagination.current_page }} из {{ pagination.last_page }}
            </span>
            <button
              :disabled="!pagination.next_page_url"
              @click="loadPage(pagination.current_page + 1)"
              class="btn btn-pagination"
            >
              Вперед
            </button>
          </div>
        </main>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';

const titles = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const pagination = ref({});

const filters = ref({
  type: [],
  year: null,
  sort_by: 'views_count',
});

const years = ref(
  Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) =>
    new Date().getFullYear() - i
  )
);

const loadTitles = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    
    if (filters.value.type.length > 0) {
      params.append('type[]', filters.value.type.join(','));
    }
    if (filters.value.year) {
      params.append('year', filters.value.year);
    }
    if (filters.value.sort_by) {
      params.append('sort_by', filters.value.sort_by);
    }
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    const response = await fetch(`/api/v1/titles?${params.toString()}`);
    const data = await response.json();
    
    titles.value = data.data || [];
    pagination.value = data.meta || {};
  } catch (error) {
    console.error('Error loading titles:', error);
  } finally {
    loading.value = false;
  }
};

const loadPage = (page) => {
  // Для простоты, просто перезагружаем с параметрами
  loadTitles();
};

watch(() => filters.value, loadTitles, { deep: true });
watch(searchQuery, () => {
  const debounceTimer = setTimeout(loadTitles, 300);
  return () => clearTimeout(debounceTimer);
});

onMounted(loadTitles);
</script>

<style scoped>
.titles-page {
  padding-bottom: 3rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.search-input {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  width: 300px;
}

.search-input:focus {
  outline: none;
  border-color: #e50914;
  background: rgba(255, 255, 255, 0.15);
}

.content {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.filters {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 8px;
  height: fit-content;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.75rem;
}

.filter-label {
  display: block;
  color: #e5e5e5;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.filter-label input {
  margin-right: 0.5rem;
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
}

.main-content {
  min-height: 400px;
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

.poster-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #808080;
  font-size: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-pagination {
  padding: 0.5rem 1.25rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-pagination:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #808080;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filter-group {
    flex: 1;
    min-width: 150px;
  }

  .titles-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .search-input {
    width: 100%;
  }
}
</style>
