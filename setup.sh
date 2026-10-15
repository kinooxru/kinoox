#!/bin/bash

# Скрипт для быстрой настройки KINOOX Laravel приложения
# Запуск: bash setup.sh

echo "🎬 KINOOX Setup Script"
echo "======================"

# Проверка Composer
if ! command -v composer &> /dev/null; then
    echo "❌ Composer не установлен. Пожалуйста, установите Composer."
    exit 1
fi

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 20+."
    exit 1
fi

# Проверка Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен."
    exit 1
fi

echo ""
echo "✅ Все зависимости найдены"
echo ""

# Установка PHP зависимостей
echo "📦 Установка PHP зависимостей..."
composer install --no-interaction
echo "✅ PHP зависимости установлены"

# Копирование .env файла
if [ ! -f .env ]; then
    echo ""
    echo "📝 Копирование .env.example в .env..."
    cp .env.example .env
    echo "✅ .env файл создан"
else
    echo ""
    echo "⚠️  .env файл уже существует"
fi

# Генерация application key
echo ""
echo "🔑 Генерация application key..."
php artisan key:generate --no-interaction
echo "✅ Application key сгенерирована"

# Установка JavaScript зависимостей
echo ""
echo "📦 Установка JavaScript зависимостей..."
npm install
echo "✅ JavaScript зависимости установлены"

# Создание директорий storage
echo ""
echo "📁 Настройка прав для storage..."
chmod -R 755 storage bootstrap/cache
echo "✅ Права установлены"

echo ""
echo "================================"
echo "✅ Установка завершена!"
echo "================================"
echo ""
echo "Следующие шаги:"
echo "1. Настройте базу данных в .env файле"
echo "2. Выполните миграции: php artisan migrate"
echo "3. Заполните базу данными: php artisan db:seed"
echo "4. Запустите development server: php artisan serve"
echo "5. Запустите frontend: npm run dev"
echo ""
echo "Или используйте Docker:"
echo "  docker-compose up -d"
echo ""
