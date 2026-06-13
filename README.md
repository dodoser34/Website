# WoodStyle International

Fullstack e-commerce-платформа мебельного бренда WoodStyle. Для локальной
разработки используются React + TypeScript, FastAPI и SQLite.

## Возможности

- интерфейс English / Russian / Deutsch / 日本語 / Français;
- каталог с серверным поиском, фильтрацией, сортировкой и пагинацией;
- цены во всех кодах ISO 4217, включаемых через административную панель;
- локальные курсы валют относительно USD;
- регистрация, JWT-авторизация, профиль и адреса;
- гостевые корзина и избранное с объединением после входа;
- серверные корзина, избранное, заказы и история статусов;
- собственные зоны международной доставки;
- единый платёжный интерфейс с локальным карточным адаптером;
- административная панель для каталога, пользователей, заказов, валют,
  доставки, изображений и сообщений;
- Alembic и совместимые с PostgreSQL SQLAlchemy-модели;
- backend/frontend тесты.

## Локальные аккаунты

| Роль | Email | Пароль |
| --- | --- | --- |
| Администратор | `admin@woodstyle.com` | `Admin123!` |
| Покупатель | `customer@woodstyle.com` | `Customer123!` |

Карты локального платёжного адаптера:

- успешная оплата: `4242 4242 4242 4242`;
- отклонённая оплата: `4000 0000 0000 0002`.

## Запуск backend

Из корня рабочей папки:

```powershell
.\.venv\Scripts\python.exe -m pip install -r .\woodstyle\backend\requirements.txt
cd .\woodstyle\backend
..\..\.venv\Scripts\python.exe seed.py
..\..\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

API: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

При первом запуске база создаётся и заполняется автоматически. Существующие
категории и товары сохраняются, их ID не меняются. Исходная база перед первой
миграцией сохранена как `backend/woodstyle.legacy-backup.db`.

## Запуск frontend

В отдельном терминале:

```powershell
cd .\woodstyle\frontend
npm install
npm run dev
```

Сайт: `http://localhost:5173`

## Проверки

```powershell
cd .\woodstyle\backend
..\..\.venv\Scripts\python.exe -m pytest

cd ..\frontend
npm run typecheck
npm run lint
npm run test
npm run build
```

## Структура

```text
backend/
  app/
    auth/ users/ products/ categories/
    cart/ favorites/ orders/ payments/
    currencies/ shipping/ admin/ storage/ contact/
    core/ services/
  alembic/
  tests/

frontend/src/
  api/ app/ components/ config/ features/ hooks/
  i18n/ pages/ store/ styles/ utils/
```

## Валюты

Базовая цена хранится в USD cents. Для отображения используется локальный курс
`rate_from_usd` и число десятичных знаков валюты. Начально включены USD, EUR,
GBP, RUB, CNY, JPY, KZT, CAD, AUD, CHF и INR. Остальные ISO-коды включаются
администратором без изменения кода.

Старые рублёвые цены мигрируются один раз по фиксированному архивному курсу
`1 USD = 71.9077 RUB`.
