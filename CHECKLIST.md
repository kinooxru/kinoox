# ✅ Чеклист для проверки после миграции

## Базовая проверка

### Backend
- [ ] Composer install прошел успешно
- [ ] .env файл создан и настроен
- [ ] APP_KEY сгенерирована
- [ ] Миграции базы данных прошли успешно
- [ ] Database seeder заполнил данные
- [ ] Laravel сервер запускается
- [ ] API endpoints доступны
- [ ] Sanctum аутентификация работает

### Frontend
- [ ] npm install прошел успешно
- [ ] Vite dev server запускается
- [ ] Главная страница рендерится
- [ ] Каталог фильмов работает
- [ ] Стили применяются правильно
- [ ] Навигация работает

### Docker
- [ ] docker-compose up -d запускает все контейнеры
- [ ] PostgreSQL доступен на порту 5432
- [ ] Redis доступен на порту 6379
- [ ] Nginx работает на порту 8080
- [ ] PHP-FPM обрабатывает запросы
- [ ] Node.js может собрать фронтенд

## API Тестирование

### Auth
- [ ] POST /api/v1/auth/register - создает пользователя
- [ ] POST /api/v1/auth/login - возвращает token
- [ ] GET /api/v1/auth/user - возвращает данные пользователя
- [ ] POST /api/v1/auth/logout - удаляет token

### Titles
- [ ] GET /api/v1/titles - возвращает список
- [ ] GET /api/v1/titles/popular - возвращает популярные
- [ ] GET /api/v1/titles/{id} - возвращает детали
- [ ] GET /api/v1/titles/{id}/episodes - возвращает эпизоды

### Bookmarks (authenticated)
- [ ] GET /api/v1/bookmarks - возвращает закладки пользователя
- [ ] POST /api/v1/bookmarks - создает закладку
- [ ] DELETE /api/v1/bookmarks/{id} - удаляет закладку
- [ ] GET /api/v1/bookmarks/check/{titleId} - проверяет закладку

### Comments
- [ ] GET /api/v1/titles/{id}/comments - возвращает комментарии
- [ ] POST /api/v1/comments - создает комментарий
- [ ] PUT /api/v1/comments/{id} - обновляет комментарий
- [ ] DELETE /api/v1/comments/{id} - удаляет комментарий

### Player
- [ ] GET /api/v1/sources/{id} - возвращает источник
- [ ] GET /api/v1/episodes/{id} - возвращает эпизод
- [ ] POST /api/v1/players/progress - сохраняет прогресс

### Search
- [ ] GET /api/v1/search?q=test - ищет фильмы
- [ ] GET /api/v1/search/popular - возвращает популярные запросы

## Функциональное тестирование

### Пользователи
- [ ] Регистрация нового пользователя
- [ ] Вход существующего пользователя
- [ ] Просмотр профиля
- [ ] Выход из системы

### Каталог
- [ ] Отображение списка фильмов
- [ ] Фильтрация по типу (movie/serial/cartoon/anime)
- [ ] Фильтрация по году
- [ ] Сортировка (популярность, рейтинг)
- [ ] Поиск по названию
- [ ] Пагинация

### Фильмы
- [ ] Просмотр деталей фильма
- [ ] Отображение эпизодов (для сериалов/аниме)
- [ ] Отображение источников для эпизодов
- [ ] Просмотр комментариев
- [ ] Добавление комментария

### Закладки
- [ ] Добавление в закладки
- [ ] Просмотр списка закладок
- [ ] Удаление из закладок
- [ ] Проверка наличия в закладках

### История
- [ ] Сохранение прогресса просмотра
- [ ] История поиска
- [ ] История просмотров

## Безопасность

- [ ] API маршруты требуют аутентификацию
- [ ] User data изолирована (user1 не видит data user2)
- [ ] Passwords хэшируются (bcrypt)
- [ ] CSRF protection работает
- [ ] Rate limiting настроен
- [ ] SQL injection защита (Eloquent queries)
- [ ] XSS защита (Vue escaping)

## Производительность

- [ ] Redis кэширование работает
- [ ] Сессии хранятся в Redis
- [ ] Оптимизация SQL запросов (n+1 solved)
- [ ] Assets минифицированы
- [ ] Database indexes созданы

## Deployment

### Local
- [ ] setup.sh работает без ошибок
- [ ] Все зависимости устанавливаются
- [ ] Приложение запускается

### Docker
- [ ] Dockerfile собирается
- [ ] docker-compose.yml поднимает все сервисы
- [ ] Volumes правильно смонтированы
- [ ] Networks настроены
- [ ] Health checks работают

### Production (95.216.97.185)
- [ ] Git push на ветку php-migration
- [ ] SSH connection к серверу
- [ ] Git pull на сервере
- [ ] Composer install --no-dev
- [ ] npm run build
- [ ] php artisan migrate --force
- [ ] php artisan deploy
- [ ] Nginx конфигурация для продакшена
- [ ] SSL сертификат (Let's Encrypt)
- [ ] Firewall настроен
- [ ] Backup database перед миграцией

## Data Migration

- [ ] Старая база данных доступна
- [ ] .env настройки для старой БД
- [ ] php artisan migrate:old-data
- [ ] Проверка количества migrated записей
- [ ] Проверка целостности данных
- [ ] Пользователи могут войти со старыми паролями
- [ ] Все фильмы импортированы
- [ ] Комментарии и закладки на месте

## Документация

- [ ] README.md актуален
- [ ] API документация (Swagger/OpenAPI)
- [ ] Комментарии в коде
- [ ] Чangelog ведется
- [ ] Инструкция по деплою

## Тесты

- [ ] Unit тесты для моделей
- [ ] Feature тесты для API
- [ ] Browser тесты (Laravel Dusk)
- [ ] CI/CD pipeline (GitHub Actions)

## Monitoring

- [ ] Laravel Telescope (опционально)
- [ ] Error logging (Sentry)
- [ ] Performance monitoring
- [ ] Database monitoring
- [ ] Uptime monitoring

---

**Итого задач**: ~100  
**Статус**: Готово к тестированию
