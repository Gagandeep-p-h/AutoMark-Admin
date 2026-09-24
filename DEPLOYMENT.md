# Production configuration

Set these values in the hosting-provider dashboards; do not commit them to the repository.

## Vercel (frontend)

```dotenv
BACKEND_INTERNAL_URL=https://automark-admin.onrender.com
AUTH_SECRET=<long-random-secret>
NEXT_PUBLIC_APP_URL=https://auto-mark-admin.vercel.app
```

## Render (backend)

```dotenv
DATABASE_URL=<private-Neon-connection-string>
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://auto-mark-admin.vercel.app
PORT=5001
```

After saving the environment variables, redeploy both services. The frontend server routes use `BACKEND_INTERNAL_URL`; without it, a Vercel deployment falls back to a local URL and cannot reach Render.
