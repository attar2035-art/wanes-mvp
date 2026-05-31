# Wanes MVP | منصة ونس

نسخة أولية نظيفة لمشروع ونس:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Auth: Phone + Password
- Hosting target: Render
- No Clerk
- No Vercel dependency

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Database

ضع رابط PostgreSQL في `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=change_this_secret
PORT=5000
```

ثم شغّل:

```bash
npm run db:init
npm run db:seed
npm run dev
```

## Default Admin

Phone:
01000000000

Password:
123456Ee
