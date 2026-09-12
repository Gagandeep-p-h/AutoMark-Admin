# 🎓 SmartAttend - Unified Fullstack Attendance System

SmartAttend is a modern automated attendance management platform comprising an **Express & Prisma REST API backend** and a **Next.js 16 administrator web portal**.

---

## 🏗 Repository Structure

```
SmartAttend/
├── package.json               # Root workspace scripts & concurrent runner
├── .env.example               # Unified environment guide
├── README.md                  # Project documentation
│
├── backend/                   # Node.js / Express REST API with Prisma ORM
│   ├── src/
│   │   ├── controllers/       # Business logic (admin, attendance, auth, students, etc.)
│   │   ├── routes/            # Express routers (/api/admin, /api/auth, etc.)
│   │   ├── middleware/        # JWT auth & role-based access control
│   │   └── prisma/            # Prisma schema, migrations, contract
│   ├── server.js              # Express server entry point (Port 5001)
│   ├── .env.example           # Backend environment template
│   └── package.json           # Backend dependencies
│
└── frontend/                  # Next.js 16 Admin Dashboard Portal (App Router)
    ├── app/                   # Next.js App Router (admin screens, auth API)
    ├── components/            # UI components, AdminShell, charts & tables
    ├── lib/
    │   ├── api.ts             # Unified fullstack API client with backend synchronization
    │   ├── auth.ts            # Jose JWT edge session handling
    │   └── utils.ts           # Utility functions
    ├── next.config.mjs        # Next.js proxy rewrites to backend (/api/backend -> :5001)
    ├── .env.example           # Frontend environment template
    └── package.json           # Frontend dependencies
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* **PostgreSQL**: v15 or higher (if running live database; otherwise frontend automatically operates in graceful fallback mode)

### 2. Install All Dependencies
From the repository root:
```bash
npm run install:all
```
*This installs dependencies across the root, `backend/`, and `frontend/`.*

### 3. Environment Variables
Copy `.env.example` in `backend/` and `frontend/`:
```bash
# In backend/
cp backend/.env.example backend/.env

# In frontend/
cp frontend/.env.example frontend/.env.local
```

### 4. Run Both Frontend and Backend Concurrently
From the root directory:
```bash
npm run dev
```

* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:5001](http://localhost:5001)
* **Backend Health**: [http://localhost:5001/health](http://localhost:5001/health)

---

## 🔑 Default Admin Credentials

| Email / Identifier | Password | Role |
|---|---|---|
| `admin@smartattend.edu` | `admin123` | Administrator |
| `admin@smartattend.edu.in` | `admin123` | Administrator |
| `admin` | `admin123` | Administrator |

---

## 🛠 Available Scripts

From the repository root:
- `npm run dev`: Concurrently runs both backend (`:5001`) and frontend (`:3000`).
- `npm run dev:frontend`: Runs only the Next.js frontend dev server.
- `npm run dev:backend`: Runs only the Express backend dev server.
- `npm run install:all`: Installs npm dependencies in all directories.
- `npm run build`: Compiles production build for Next.js.
- `npm run start`: Starts production instances for both services.

---

## 🔌 API & Integration Features

- **Next.js Proxy Rewrites**: Frontend calls `/api/backend/*` which automatically proxies to `http://localhost:5001/api/*`, eliminating CORS problems.
- **Smart Fallback**: If PostgreSQL or Express is temporarily offline, the frontend falls back seamlessly to demo data so you can continue building and testing without crashes.
- **Header Status Badge**: An interactive indicator in the top header displays the live connectivity state of the backend API.
