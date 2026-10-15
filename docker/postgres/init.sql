-- ─────────────────────────────────────────────────────────────
--  KINOOX — инициализация PostgreSQL 16
--  Выполняется один раз при создании тома pg_data.
-- ─────────────────────────────────────────────────────────────

-- Расширения, нужные приложению
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- нечёткий поиск по названиям
CREATE EXTENSION IF NOT EXISTS "unaccent";     -- поиск без учёта диакритики
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- статистика запросов
CREATE EXTENSION IF NOT EXISTS "btree_gin";    -- составные GIN-индексы

-- Часовой пояс по умолчанию
ALTER DATABASE kinoox_db SET timezone TO 'Europe/Moscow';

-- Схема приложения
ALTER DATABASE kinoox_db SET search_path TO public;