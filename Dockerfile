# PHP-FPM для Laravel
FROM php:8.3-fpm

# Устанавливаем системные зависимости
RUN docker-php-ext-install pdo pdo_pgsql pcntl opcache

# Устанавливаем Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Настраиваем PHP
RUN echo "memory_limit=512M" > /usr/local/etc/php/conf.d/docker-php-memlimit.ini
RUN echo "upload_max_filesize=100M" >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini
RUN echo "post_max_size=100M" >> /usr/local/etc/php/conf.d/docker-php-memlimit.ini

# Создаем пользователя
RUN groupadd -g 1000 www && \
    useradd -u 1000 -g www -m -s /bin/bash www

# Создаем директории приложения
RUN mkdir -p /var/www/html
WORKDIR /var/www/html

# Копируем файлы
COPY --chown=www:www . .

# Устанавливаем зависимости
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Устанавливаем права
RUN chmod -R 755 storage bootstrap/cache

# Переключаемся на пользователя www
USER www

# Запускаем PHP-FPM
CMD ["php-fpm"]
