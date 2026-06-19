# GitHub Pages deploy

This folder documents the frontend-only deployment mode.
The backend stays in the repository, but GitHub Pages builds only `woodstyle/frontend`.

## What Works Without Backend

- Catalog, product pages, search, filters and sorting.
- Images and product galleries.
- Login and registration with local demo accounts.
- Profile, addresses, cart, favorites and orders.
- Checkout with demo card payment.
- Admin panel: products, categories, orders, users, currencies, shipping and messages.

All data is stored in browser `localStorage`, so it persists on the same browser after refresh.

## Demo Accounts

- Admin: `admin@woodstyle.com` / `Admin123!`
- Customer: `customer@woodstyle.com` / `Customer123!`

## How To Publish

1. Push the repository to GitHub.
2. Open repository Settings.
3. Open Pages.
4. In Source select GitHub Actions.
5. Push to `main` or run the workflow manually.

The workflow file is:

```text
.github/workflows/github-pages.yml
```

## Local Static Build Test

From `woodstyle/frontend`:

```powershell
$env:VITE_FRONTEND_ONLY="true"
$env:VITE_AUTH_STORAGE_MODE="local"
$env:VITE_BASE_PATH="/"
npm run build
npm run preview
```

For a project GitHub Pages URL like `https://USER.github.io/REPO/`, the workflow sets:

```env
VITE_BASE_PATH=/REPO/
```
