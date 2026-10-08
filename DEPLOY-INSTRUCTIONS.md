# 🚀 Развёртывание KINOOX на сервере 95.216.97.185

## 📋 Предварительные требования

### 1. Доступ к серверу
- **IP:** 95.216.97.185
- **Домен:** kinoox.ru (и www.kinoox.ru)
- **Пользователь:** root
- **SSH-ключ:** должен быть добавлен на сервер

### 2. DNS настройки
⚠️ **ВАЖНО:** Домены `kinoox.ru` и `www.kinoox.ru` должны указывать на IP `95.216.97.185`
перед первым запуском — иначе Let's Encrypt не выпустит SSL-сертификат.

### 3. Локальные файлы
- ✅ `.env` файл готов (содержит секреты)
- ✅ Все исходные файлы проекта в репозитории
- ✅ Репозиторий на GitHub/Gitverse обновлён

---

## 📦 Шаг 1: Подключение к серверу

```bash
ssh root@95.216.97.185
```

Если используется SSH-ключ с нестандартным именем:
```bash
ssh -i ~/.ssh/your_key_name root@95.216.97.185
```

---

## 🛠️ Шаг 2: Клонирование репозитория

```bash
cd /opt
git clone https://github.com/kinooxru/kinoox.git kinoox
cd kinoox
```

Или через Gitverse:
```bash
git clone https://gitverse.ru/kinooxru/kinoox.git kinoox
cd kinoox
```

---

## 🔐 Шаг 3: Настройка .env файла

Скопируйте локальный `.env` файл на сервер:

**С локальной машины (PowerShell):**
```powershell
scp "D:\KINOOX\.env" root@95.216.97.185:/opt/kinoox/.env
```

**Или перенесите содержимое вручную:**
1. Откройте файл `D:\KINOOX\.env` на локальной машине
2. Скопируйте всё содержимое
3. На сервере выполните:
```bash
nano /opt/kinoox/.env
```
4. Вставьте содержимое и сохраните (Ctrl+O, Enter, Ctrl+X)

---

## 🚀 Шаг 4: Первичная настройка сервера

Запустите скрипт начальной настройки:

```bash
sudo bash deploy/setup.sh
```

Скрипт автоматически:
- ✅ Обновит пакеты и установит базовые утилиты
- ✅ Настроит часовой пояс Europe/Moscow
- ✅ Создаст swap 4 ГБ
- ✅ Установит Docker и Docker Compose
- ✅ Настроит firewall (UFW)
- ✅ Установит fail2ban для защиты SSH
- ✅ Создаст каталоги приложения
- ✅ Установит Cockpit для мониторинга (порт 9090)

**Время выполнения:** ~5-10 минут

---

## 🐳 Шаг 5: Развёртывание приложения

После завершения `setup.sh`, запустите деплой:

```bash
bash deploy/deploy.sh
```

Скрипт выполнит:
1. ✅ Сборку Docker-образов (api, web, migrate)
2. ✅ Запуск всех 20 сервисов
3. ✅ Ожидание готовности PostgreSQL, Redis, API, Web
4. ✅ Применение миграций базы данных
5. ✅ Выпуск SSL-сертификата Let's Encrypt
6. ✅ Проверку доступности https://kinoox.ru

**Время выполнения:** ~10-15 минут

### Флаги для deploy.sh:
- `--pull` — обновить код из git перед сборкой
- `--no-cache` — собрать образы без кэша
- `--skip-backup` — пропустить резервное копирование

---

## ✅ Шаг 6: Проверка работы

### Проверка статуса контейнеров:
```bash
cd /opt/kinoox
docker compose -f docker/docker-compose.yml ps
```

Должны быть все 20 контейнеров в статусе `Up`.

### Проверка API:
```bash
curl -s https://kinoox.ru/api/health | jq
```

Ожидаемый ответ: `200 OK`

### Проверка сайта:
Откройте в браузере: **https://kinoox.ru**

### Проверка логов:
```bash
# Логи API
docker compose -f docker/docker-compose.yml logs -f api

# Логи сайта
docker compose -f docker/docker-compose.yml logs -f web

# Логи Nginx
docker compose -f docker/docker-compose.yml logs --tail 100 nginx
```

---

## 📊 Доступ к сервисам

| Сервис | URL | Доступ |
|--------|-----|--------|
| **Основной сайт** | https://kinoox.ru | 🌐 Публичный |
| **API** | https://kinoox.ru/api/v1 | 🌐 Публичный |
| **Grafana** | https://kinoox.ru/grafana/ | 🔒 Локально |
| **Prometheus** | https://kinoox.ru/prometheus/ | 🔒 Локально |
| **Adminer** | https://kinoox.ru/adminer/ | 🔒 Локально |
| **Cockpit** | https://95.216.97.185:9090 | 🔒 UFW порт 9090 |

### SSH-туннель для админ-панелей:
```bash
ssh -L 3000:localhost:3000 root@95.216.97.185
# Затем откройте http://localhost:3000 в браузере
```

---

## 🔄 Обновление проекта

Когда вы внесёте изменения и отправите их в git:

**На локальной машине:**
```bash
git add .
git commit -m "your commit message"
git push origin main
git push gitverse main
```

**На сервере:**
```bash
cd /opt/kinoox
bash deploy/deploy.sh --pull
```

Или вручную:
```bash
cd /opt/kinoox
git pull
docker compose -f docker/docker-compose.yml up -d --build
```

---

## 🛡️ Мониторинг и бэкапы

### Автоматические бэкапы:
- **БД:** Ежедневно в 02:00, хранение 30 дней
- **WAL-архив:** Для восстановления на любой момент (PITR)

### Мониторинг:
- **CPU/Memory:** Grafana → https://kinoox.ru/grafana/
- **Логи:** Loki → https://kinoox.ru/grafana/ (datasource: Loki)
- **Алерты:** Alertmanager → https://kinoox.ru/alertmanager/

---

## 🆘 Решение проблем

### Nginx не стартует (certificate error):
```bash
# Перевыпуск SSL-сертификата
cd /opt/kinoox
docker compose -f docker/docker-compose.yml run --rm certbot
docker compose -f docker/docker-compose.yml restart nginx
```

### API не проходит healthcheck:
```bash
# Проверка подключения к БД
docker compose -f docker/docker-compose.yml logs api | grep -i postgres

# Перезапуск API
docker compose -f docker/docker-compose.yml restart api
```

### Миграции не применились:
```bash
# Ручной запуск миграций
docker compose -f docker/docker-compose.yml run --rm migrate
```

### Закончилось место:
```bash
# Очистка старых образов
docker system prune -af --volumes=false

# Проверка бэкапов
ls -lh /opt/kinoox/storage/backups/
```

---

## 📝 Полезные команды

```bash
# Перейти в каталог проекта
cd /opt/kinoox

# Определить переменную для docker compose
DC="docker compose -f docker/docker-compose.yml"

# Состояние сервисов
$DC ps

# Логи конкретного сервиса
$DC logs -f api

# Перезапуск сервиса
$DC restart web

# Полная остановка (данные сохраняются)
$DC down

# Полная перезагрузка
$DC up -d --remove-orphans

# Проверка использования ресурсов
docker stats --no-stream

# Вход в контейнер API
$DC exec -it api sh

# Вход в PostgreSQL
$DC exec -it postgres psql -U kinoox -d kinoox_db
```

---

## 📞 Контакты поддержки

При возникновении проблем:
1. Проверьте логи: `docker compose logs -f`
2. Проверьте мониторинг: Grafana
3. Проверьте алерты: Alertmanager

---

**Успешного развёртывания! 🎉**
