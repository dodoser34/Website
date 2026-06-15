# Database files

Локальная база WoodStyle хранится здесь:

```text
data/woodstyle.sqlite3
```

Файл базы не добавляется в Git. Путь задаётся в `backend/.env`:

```env
WOODSTYLE_DATABASE_PATH=data/woodstyle.sqlite3
```

Для PostgreSQL вместо пути укажите полный URL:

```env
WOODSTYLE_DATABASE_URL=postgresql+psycopg://user:password@localhost/woodstyle
```

Резервные копии SQLite можно хранить в `data/backups/`; эта папка также
исключена из Git.
