# 🛍️ Mi Negocio AVEMARÍA

> Gestión de inventario, ventas, contabilidad y ganancias para **Mi Negocio AVEMARÍA** — emprendimiento de joyería artesanal colombiana.

---

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| **Backend** | Express 5 · TypeScript · Prisma · PostgreSQL (Neon) |
| **Web** | React 18 · Vite · Zustand · Recharts · Vanilla CSS |
| **Mobile** | React Native · Expo · React Navigation |
| **Infra** | Docker Compose · nginx |

---

## 🚀 Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `backend/.env.example` → `backend/.env` y ajusta:

```env
DATABASE_URL="postgresql://user:pass@host/db?schema=public"
JWT_SECRET="mi-secreto-jwt"
JWT_REFRESH_SECRET="mi-secreto-refresh"
```

### 3. Migrar y sembrar la BD

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Correr en desarrollo

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd backend && npx tsx src/app.ts

# Terminal 2 — Web (http://localhost:5173)
npm run dev --workspace=apps/web

# Terminal 3 — Mobile (Expo)
cd apps/mobile && npx expo start
```

**Login:** `yo@minegocio.com` / `Avemaria123!`

---

## 🧪 Tests

```bash
# Unit tests
cd backend && npx vitest run src/__tests__/unit.test.ts

# Integration tests (requiere backend corriendo)
cd backend && npx vitest run src/__tests__/integration.test.ts
```

---

## 🐳 Docker

```bash
docker compose up --build
```

| Servicio | Puerto |
|----------|--------|
| Web (nginx) | `80` |
| Backend API | `3000` |
| PostgreSQL | `5432` |

---

## 📁 Estructura

```
mi-negocio-avemaria/
├── backend/                    # Express API
│   ├── src/
│   │   ├── modules/           # auth, inventory, sales, purchases, customers, accounting, dashboard
│   │   ├── middleware/        # auth, validation, error handling
│   │   ├── prisma/            # schema, seed, migrations
│   │   └── __tests__/         # unit + integration tests
│   └── Dockerfile
├── apps/
│   ├── web/                   # React + Vite
│   │   ├── src/
│   │   │   ├── pages/        # Dashboard, Inventory, Sales, Accounting, Profits, Customers
│   │   │   ├── components/   # Layout
│   │   │   ├── stores/       # Zustand (auth, ui)
│   │   │   └── lib/          # API client
│   │   └── Dockerfile
│   └── mobile/                # React Native + Expo
│       └── src/
│           ├── screens/      # Dashboard, Inventory, NewSale, Profits, Login
│           └── navigation/   # Bottom tabs
└── docker-compose.yml
```

---

## 🎨 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| `--cream` | `#FAF8F4` | Fondo |
| `--gold` | `#C8A96E` | Acento, botones |
| `--ink` | `#1A1714` | Texto |
| `--green2` | `#2A9E5E` | Ganancia |
| `--red2` | `#C0392B` | Gasto, alerta |

**Tipografía:** Cormorant (títulos) · Jost (cuerpo) · DM Mono (números)

---

## 📊 API Endpoints

| Módulo | Ruta | Métodos |
|--------|------|---------|
| Auth | `/api/auth/*` | POST login, register, refresh, logout · GET me |
| Products | `/api/products` | GET, POST, PATCH, DELETE · GET low-stock, stats |
| Sales | `/api/sales` | GET, POST · PATCH status · GET summary |
| Purchases | `/api/purchases` | GET, POST · GET summary |
| Customers | `/api/customers` | GET, POST, PATCH |
| Accounting | `/api/accounting/*` | GET/POST transactions · GET summary, by-month, per-peso |
| Dashboard | `/api/dashboard` | GET (KPIs completos) |

---

## 📄 Licencia

Privado — Mi Negocio AVEMARÍA © 2026
