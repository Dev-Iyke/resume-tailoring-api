# Resume Tailoring API

REST API for managing a candidate's plain-text resume and job-specific tailoring requests. Requests are linked to the authenticated user's resume.

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

4. Execute `prisma/seed.sql` in pgAdmin's Query Tool to add a local test user and resume. The local account is `jamie.example@example.test` with password `LocalOnlyPassword123!`; do not use this account outside local development.

5. Start the API:

   ```bash
   npm run start:dev
   ```

Swagger documentation: `http://localhost:5000/api/docs`.
Sample authenticated requests are in `requests.http`. Log in and set the returned token in `@accessToken` before running protected requests.

## Endpoints

All endpoints use the `/api/v1` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Register and send an email verification code |
| `POST` | `/auth/verify-email` | Verify an email address |
| `POST` | `/auth/resend-verification` | Resend an email verification code |
| `POST` | `/auth/login` | Log in and receive a JWT |
| `POST` | `/resumes` | Create the authenticated user's resume |
| `GET` | `/resumes/me` | Get the authenticated user's resume |
| `PATCH` | `/resumes/me` | Update the authenticated user's resume; existing completed requests using it become stale |
| `POST` | `/tailoring-requests` | Create a tailoring request |
| `GET` | `/tailoring-requests` | List tailoring requests |
| `GET` | `/tailoring-requests/:id` | Get a tailoring request |
| `PATCH` | `/tailoring-requests/:id` | Update a tailoring request; changing job details marks an existing result stale, while result-only edits remain completed |
| `DELETE` | `/tailoring-requests/:id` | Delete a tailoring request |

## Tests

```bash
npm test
```

## Project documents

- [API specification](docs/api-specification.docx)
- [Architecture diagram](docs/architecture.md)
- [Issue log](docs/issue-log.md)
