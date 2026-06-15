# WoodStyle International

Fullstack-интернет-магазин мебели с React + TypeScript frontend и
Python/FastAPI backend.

## Возможности

- каталог с поиском, фильтрами, сортировкой и пагинацией;
- интерфейс и данные на EN, RU, DE, JA и FR;
- цены в валютах ISO 4217;
- регистрация, профиль, адреса, корзина и избранное;
- checkout, международная доставка и демонстрационная оплата;
- история заказов и статусов;
- административная панель;
- защищённая загрузка изображений;
- premium responsive UI, toast, modal, drawer и motion layer;
- поддержка `prefers-reduced-motion`;
- backend и frontend тесты.

## Стек

Backend:

- Python, FastAPI, SQLAlchemy 2, Pydantic, Alembic;
- SQLite локально, модели совместимы с PostgreSQL;
- Argon2id для новых паролей;
- Pytest.

Frontend:

- React 19, TypeScript, Vite;
- React Router, TanStack Query, Zustand;
- React Hook Form, Zod;
- Motion;
- Vitest и ESLint.

## Локальный запуск backend

Из корня репозитория:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\woodstyle\backend\requirements.txt
cd .\woodstyle\backend
..\..\.venv\Scripts\python.exe seed.py
..\..\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Адреса:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- API health: `http://localhost:8000/api/v1/health`

## Локальный запуск frontend

В отдельном терминале:

```powershell
cd .\woodstyle\frontend
npm install
npm run dev
```

Сайт: `http://localhost:5173`

## Переменные окружения

Шаблоны:

- `woodstyle/backend/.env.example`
- `woodstyle/frontend/.env.example`

Основные backend-переменные:

```env
APP_ENV=development
DEBUG=false
WOODSTYLE_DATABASE_PATH=data/woodstyle.sqlite3
WOODSTYLE_SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=14
CORS_ORIGINS=http://localhost:5173
ALLOWED_HOSTS=localhost,127.0.0.1
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
CSRF_PROTECTION_ENABLED=true
RATE_LIMIT_ENABLED=true
MAX_UPLOAD_SIZE_MB=5
SECURITY_HEADERS_ENABLED=true
LOG_LEVEL=INFO
```

Для production обязательно:

```env
APP_ENV=production
DEBUG=false
WOODSTYLE_SECRET_KEY=<long-random-secret>
COOKIE_SECURE=true
COOKIE_SAMESITE=strict
CORS_ORIGINS=https://your-frontend.example
ALLOWED_HOSTS=your-api.example
```

Приложение не запустится в production без `WOODSTYLE_SECRET_KEY`.

Локальный `.env` находится прямо в `woodstyle/backend/.env`, рядом с
`main.py`, `seed.py`, `requirements.txt` и `alembic.ini`. SQLite-файл хранится
отдельно от кода: `woodstyle/backend/data/woodstyle.sqlite3`.

## Авторизация и refresh flow

- access token действует 15 минут;
- refresh token действует 14 дней;
- refresh-сессии хранятся в базе;
- в базе сохраняется только SHA-256 hash refresh token;
- refresh выполняет rotation: старый token отзывается;
- повторное использование старого token отзывает всю его session family;
- logout отзывает refresh-сессию;
- frontend при `401` делает один refresh и один повтор исходного запроса.

Новые пароли хешируются Argon2id. Старые PBKDF2-хеши продолжают работать и
автоматически обновляются до Argon2id после успешного входа.

Frontend поддерживает два режима:

```env
VITE_AUTH_STORAGE_MODE=local
```

`local` предназначен для локальной демонстрации и хранит токены в
`localStorage`. Это не production-вариант.

```env
VITE_AUTH_STORAGE_MODE=cookie
```

`cookie` хранит access token в памяти, а refresh token получает через
`HttpOnly Secure SameSite` cookie. В production backend не возвращает refresh
token в JSON.

## CSRF

Cookie refresh flow использует double-submit token:

- backend устанавливает readable cookie `woodstyle_csrf`;
- frontend передаёт значение в `X-CSRF-Token`;
- backend проверяет совпадение для cookie refresh.

Остальные защищённые API-запросы используют bearer access token и не полагаются
на ambient authentication cookie.

## Rate limiting

По умолчанию защищены:

- login: 5 запросов в минуту на IP + email;
- register: 5 запросов в минуту на IP;
- refresh: 20 запросов в минуту;
- contact: 3 запроса в минуту;
- checkout/payment: 10 запросов в минуту;
- admin mutations: 30 запросов в минуту.

Текущий limiter хранится в памяти процесса. Для нескольких production workers
его нужно заменить общим Redis-backed limiter.

## Загрузка изображений

Admin upload:

- доступен только роли `admin`;
- принимает JPEG, PNG и WebP;
- проверяет MIME type и расширение;
- проверяет реальный формат через Pillow;
- ограничивает размер и количество пикселей;
- создаёт UUID-имя;
- удаляет EXIF при повторном сохранении;
- не использует пользовательский путь или имя файла;
- пишет действие в admin audit log.

## Security headers и CORS

Backend добавляет CSP, `nosniff`, `DENY` для frame, Referrer Policy,
Permissions Policy, COOP и CORP. В production с HTTPS добавляется HSTS.

CORS принимает только origins из `CORS_ORIGINS`, ограниченный набор methods и
headers. Wildcard origins не используется.

## Checkout и оплата

Сумма заказа всегда пересчитывается backend. Frontend total не считается
доверенным. Backend проверяет остатки и уменьшает stock только после успешной
оплаты.

Payment endpoint поддерживает idempotency key, поэтому повтор одного и того же
запроса не уменьшает stock второй раз.

Тестовые карты:

- `4242 4242 4242 4242` — успешная оплата;
- `4000 0000 0000 0002` — отклонённая оплата.

Полный номер карты, CVC и срок действия не сохраняются. В базе остаются только
статус, reference и последние четыре цифры.

## Demo accounts

Администратор:

- Email: `admin@woodstyle.com`
- Пароль: `Admin123!`

Покупатель:

- Email: `customer@woodstyle.com`
- Пароль: `Customer123!`

## Проверки

Backend:

```powershell
cd .\woodstyle\backend
..\..\.venv\Scripts\python.exe -m pytest
```

Frontend:

```powershell
cd .\woodstyle\frontend
npm run typecheck
npm run lint
npm run test
npm run build
```

## Перед production

- использовать PostgreSQL;
- применить Alembic migration `20260615_01`;
- заменить in-memory rate limiter на Redis;
- подключить реального платёжного провайдера;
- хранить медиа в object storage;
- настроить HTTPS, reverse proxy и резервные копии;
- подключить централизованные logs, monitoring и alerting;
- настроить CI/CD и browser E2E tests;
- проверить CSP для production frontend domain.
