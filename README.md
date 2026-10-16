# Resume Tailoring API

REST API for managing job-specific resume tailoring requests. Each request is linked to a candidate's saved resume and includes a job title, company, and job description.

## Stack

- NestJS
- PostgreSQL
- Prisma ORM

## Requirements

- Node.js 24.x
- PostgreSQL

## Local setup

1. Install dependencies and create a local environment file:

   ```bash
   npm install
   cp .env.example .env
   ```

2. Set `DATABASE_URL` in `.env` to the connection string for your PostgreSQL database.

3. Generate the Prisma client and apply the migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Execute `prisma/seed.sql` in pgAdmin's Query Tool to add a dummy user and resume.

5. Start the API:

   ```bash
   npm run start:dev
   ```

Swagger documentation: `http://localhost:5000/api/docs`.
Sample CRUD requests are in `requests.http`. Replace `@requestId` with the ID returned by the create request before running the single-request examples.

## Endpoints

All endpoints use the `/api/v1` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/tailoring-requests` | Create a tailoring request |
| `GET` | `/tailoring-requests` | List tailoring requests |
| `GET` | `/tailoring-requests/:id` | Get a tailoring request |
| `PATCH` | `/tailoring-requests/:id` | Update a tailoring request |
| `DELETE` | `/tailoring-requests/:id` | Delete a tailoring request |

## Tests

```bash
npm test
```
