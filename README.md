# KINOOX - Online Cinema Platform (Laravel 11 Edition)

Онлайн-кинотеатр на стеке: **Laravel 11 + Vue 3 + Inertia.js + PostgreSQL + Redis**

## 🚀 Технологии

- **Backend**: Laravel 11, PHP 8.3
- **Frontend**: Vue 3, Inertia.js, Vite
- **Database**: PostgreSQL 15
- **Cache/Session**: Redis 7
- **Authentication**: Laravel Sanctum
- **Web Server**: Nginx (Docker)

## 📋 Требования

- Docker & Docker Compose
- PHP 8.3+ (для локальной разработки без Docker)
- Composer
- Node.js 20+
- npm или yarn

## 🛠 Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd php-app
```

### 2. Установка зависимостей

#### PHP зависимости:
```bash
composer install
```

#### JavaScript зависимости:
```bash
npm install
```

### 3. Настройка окружения

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Настройка Docker

```bash
# Запуск Docker контейнеров
docker-compose up -d

# Установка прав для storage директории
docker-compose exec app chmod -R 755 storage bootstrap/cache
```

### 5. Настройка базы данных

```bash
# Выполнение миграций
docker-compose exec app php artisan migrate

# Заполнение базы тестовыми данными
docker-compose exec app php artisan db:seed
```

### 6. Сборка фронтенда

```bash
# Для разработки
docker-compose exec node npm run dev

# Или локально
npm run dev
```

### 7. Запуск приложения

```bash
# Запуск Laravel development server в Docker
docker-compose exec app php artisan serve --host=0.0.0.0 --port=8000

# Nginx уже настроен на порту 8080
# Откройте http://localhost:8080
```

## 📁 Структура проекта

```
php-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/          # API контроллеры
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── TitleController.php
│   │   │   │   ├── BookmarkController.php
│   │   │   │   ├── CommentController.php
│   │   │   │   ├── PlayerController.php
│   │   │   │   └── SearchController.php
│   │   │   └── Controller.php
│   │   └── Middleware/
│   ├── Models/               # Eloquent модели
│   └── Providers/
├── bootstrap/
├── config/                   # Конфигурационные файлы
├── database/
│   ├── migrations/           # Миграции базы данных
│   └── seeders/              # Seeders
├── docker/
│   └── nginx/                # Nginx конфигурация
├── public/                   # Public assets
├── resources/
│   ├── css/
│   ├── js/                   # Vue компоненты
│   │   ├── pages/            # Страницы Inertia
│   │   └── layouts/          # Layouts
│   └── views/                # Blade шаблоны
├── routes/
│   ├── api.php               # API маршруты
│   └── web.php               # Web маршруты
├── storage/                  # Storage files
├── docker-compose.yml
├── Dockerfile
├── package.json
└── composer.json
```

## 🔌 API Endpoints

### Auth
- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `POST /api/v1/auth/logout` - Выход
- `GET /api/v1/auth/user` - Информация о пользователе

### Titles (Публичные)
- `GET /api/v1/titles` - Список фильмов
- `GET /api/v1/titles/popular` - Популярные фильмы
- `GET /api/v1/titles/{id}` - Детали фильма
- `GET /api/v1/titles/{id}/episodes` - Эпизоды фильма

### Bookmarks (Требует авторизации)
- `GET /api/v1/bookmarks` - Список закладок
- `POST /api/v1/bookmarks` - Добавить закладку
- `DELETE /api/v1/bookmarks/{id}` - Удалить закладку
- `GET /api/v1/bookmarks/check/{titleId}` - Проверить закладку

### Comments
- `GET /api/v1/titles/{id}/comments` - Комментарии к фильму
- `POST /api/v1/comments` - Добавить комментарий
- `PUT /api/v1/comments/{id}` - Обновить комментарий
- `DELETE /api/v1/comments/{id}` - Удалить комментарий

### Player
- `GET /api/v1/sources/{id}` - Получить источник
- `GET /api/v1/episodes/{id}` - Получить эпизод
- `POST /api/v1/players/progress` - Сохранить прогресс

### Search
- `GET /api/v1/search?q=query` - Поиск
- `GET /api/v1/search/popular` - Популярный поиск

## 🎨 Vue Pages

- `Home.vue` - Главная страница
- `Titles.vue` - Каталог фильмов
- `TitleDetail.vue` - Детали фильма (создать)
- `Bookmarks.vue` - Закладки (создать)
- `Search.vue` - Поиск (создать)

## 🔄 Разработка

### Backend
```bash
# Запуск Laravel queue worker
docker-compose exec app php artisan queue:work

# Запуск scheduler
docker-compose exec app php artisan schedule:work
```

### Frontend
```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build
```

## 🚢 Деплой на сервер

### 1. Push в Git
```bash
git add .
git commit -m "Initial Laravel implementation"
git push origin php-migration
```

### 2. Деплой на сервер (95.216.97.185)

```bash
# SSH на сервер
ssh user@95.216.97.185

# Клонировать репозиторий
git clone <repository-url>
cd php-app

# Установка зависимостей
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Копирование .env
cp .env.example .env
php artisan key:generate

# Выполнение миграций
php artisan migrate --force

# Перезапуск PHP-FPM и Nginx
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
```

### 3. Nginx конфигурация для продакшена

Создайте `/etc/nginx/sites-available/kinoox`:

```nginx
server {
    listen 80;
    server_name kinoox.example.com;
    root /var/www/kinoox/public;
    index index.php;

    charset utf-8;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 📝 Тестовые аккаунты

После запуска seeders:

**Пользователь:**
- Email: test@example.com
- Password: password

**Администратор:**
- Email: admin@kinoox.com
- Password: admin123

## ⚠️ Известные ограничения текущей версии

1. **Player integration** - Заглушка для vibix/veoveo API
2. **File upload** - Требуется настройка S3 или локального storage
3. **Real-time features** - Не реализованы (Broadcasting)
4. **Admin panel** - Отсутствует
5. **Testing** - Unit/Feature тесты не написаны
6. **Caching strategy** - Базовая настройка
7. **Error handling** - Базовая обработка

## 📜 License

[Добавить лицензию]

## 👥 Authors

- KINOOX Team

## 🙏 Acknowledgments

- Laravel 11
- Vue 3
- Inertia.js
- Vite
