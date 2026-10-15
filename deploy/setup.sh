#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  KINOOX — первичная настройка сервера
#  Debian 12 (Bookworm) · i7-6700 / 64 ГБ RAM / 2×512 ГБ SSD
#  IP: 95.216.97.185 · домен: kinoox.ru
#
#  Запуск: sudo bash deploy/setup.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="kinoox.ru"
SERVER_IP="95.216.97.185"
APP_DIR="/opt/kinoox"
SWAP_SIZE="4G"

log() {
  echo -e "\n\033[1;36m▶ $*\033[0m"
}

warn() {
  echo -e "\033[1;33m⚠ $*\033[0m"
}

error() {
  echo -e "\033[1;31m✖ $*\033[0m" >&2
  exit 1
}

# ── Проверка прав ────────────────────────────────────────────
if [[ "${EUID}" -ne 0 ]]; then
  error "Скрипт нужно запускать от root: sudo bash deploy/setup.sh"
fi

# ── Проверка ОС ──────────────────────────────────────────────
log "Проверяем операционную систему"
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID}" != "debian" ]]; then
    warn "Ожидается Debian 12, обнаружено: ${PRETTY_NAME}"
  else
    echo "Обнаружено: ${PRETTY_NAME}"
  fi
fi

# ── Обновление пакетов ───────────────────────────────────────
log "Обновляем список пакетов"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

log "Устанавливаем базовые утилиты"
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release \
  git make htop iotop ncdu unzip \
  ufw fail2ban chrony logrotate

# ── Часовой пояс ─────────────────────────────────────────────
log "Устанавливаем часовой пояс Europe/Moscow"
timedatectl set-timezone Europe/Moscow
systemctl enable --now chrony

# ── Swap 4 ГБ ────────────────────────────────────────────────
log "Настраиваем swap ${SWAP_SIZE}"
if swapon --show | grep -q '/swapfile'; then
  echo "Swap уже настроен"
else
  fallocate -l "${SWAP_SIZE}" /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab

  # Для сервера с 64 ГБ RAM swap используется редко
  sysctl -w vm.swappiness=10
  sysctl -w vm.vfs_cache_pressure=50
  cat > /etc/sysctl.d/99-kinoox.conf <<'EOF'
# KINOOX — настройки ядра под нагрузку
vm.swappiness = 10
vm.vfs_cache_pressure = 50
vm.max_map_count = 262144
fs.file-max = 2097152
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 16384
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.ip_local_port_range = 10240 65000
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_fastopen = 3
EOF
  sysctl --system > /dev/null
fi

# ── Docker ───────────────────────────────────────────────────
log "Устанавливаем Docker и Docker Compose"
if command -v docker >/dev/null 2>&1; then
  echo "Docker уже установлен: $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -qq
  apt-get install -y -qq \
    docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

  systemctl enable --now docker
fi

# Ограничения Docker: логи и ulimits
log "Настраиваем демон Docker"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Soft": 65536,
      "Hard": 65536
    },
    "nproc": {
      "Name": "nproc",
      "Soft": 4096,
      "Hard": 4096
    }
  },
  "live-restore": true,
  "max-concurrent-downloads": 10,
  "storage-driver": "overlay2"
}
EOF
systemctl restart docker

# ── Firewall ─────────────────────────────────────────────────
log "Настраиваем UFW"
ufw --force reset > /dev/null
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp comment 'SSH' > /dev/null
ufw allow 80/tcp comment 'HTTP' > /dev/null
ufw allow 443/tcp comment 'HTTPS' > /dev/null
# Cockpit для мониторинга сервера
ufw allow 9090/tcp comment 'Cockpit' > /dev/null
ufw --force enable > /dev/null

log "Настраиваем fail2ban"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 7200
EOF
systemctl enable --now fail2ban

# ── Каталоги приложения ──────────────────────────────────────
log "Создаём каталоги приложения в ${APP_DIR}"
mkdir -p "${APP_DIR}"/{storage/downloads,storage/downloads/updates,storage/backups,storage/backups/wal_archive,storage/screenshots,deploy/ssl,deploy/ssl-www,logs}

# Права: Nginx читает файлы сборок, PostgreSQL пишет бэкапы
chown -R root:root "${APP_DIR}"
chmod -R 755 "${APP_DIR}/storage"
chmod 700 "${APP_DIR}/deploy/ssl"

# ── Логирование ──────────────────────────────────────────────
log "Настраиваем logrotate для логов приложения"
cat > /etc/logrotate.d/kinoox <<EOF
${APP_DIR}/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF

# ── Cockpit для мониторинга ──────────────────────────────────
log "Устанавливаем Cockpit (порт 9090)"
apt-get install -y -qq cockpit
systemctl enable --now cockpit.socket

# ── Итоги ────────────────────────────────────────────────────
log "Готово. Проверка окружения:"
echo "  Docker:      $(docker --version)"
echo "  Compose:     $(docker compose version --short 2>/dev/null || echo 'плагин не найден')"
echo "  ОС:          $(. /etc/os-release && echo "${PRETTY_NAME}")"
echo "  Ядро:        $(uname -r)"
echo "  CPU:         $(nproc) потоков"
echo "  RAM:         $(free -h | awk '/^Mem:/ {print $2}')"
echo "  Swap:        $(free -h | awk '/^Swap:/ {print $2}')"
echo "  Диск /:      $(df -h / | awk 'NR==2 {print $2" (свободно "$4")"}')"
echo "  Часовой пояс: $(timedatectl show -p Timezone --value)"

echo ""
echo -e "\033[1;32m✔ Сервер готов к развёртыванию KINOOX\033[0m"
echo ""
echo "Дальнейшие шаги:"
echo "  1. git clone <репозиторий> ${APP_DIR}"
echo "  2. cd ${APP_DIR} && cp .env.example .env && nano .env"
echo "  3. bash deploy/deploy.sh"
