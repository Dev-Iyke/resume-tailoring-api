# Resume Tailoring API

A backend project for early-career tech professionals to tailor resume text to specific job descriptions while keeping recommendations grounded in their experience.

## Stack

- NestJS
- PostgreSQL 17
- Prisma ORM 7

## Run locally

Requirements: Node.js 24.x, npm, and PostgreSQL 17.

From the project root:

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to your local PostgreSQL connection string, then start the API:

```bash
npm run start:dev
```
