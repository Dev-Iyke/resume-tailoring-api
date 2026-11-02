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

2. Set `DATABASE_URL` in `.env` to your PostgreSQL database. Set the SMTP and Groq values if you want to use email verification and AI generation.

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
| `PATCH` | `/resumes/me` | Update the authenticated user's resume; completed requests using it become stale |
| `POST` | `/tailoring-requests` | Create a tailoring request |
| `POST` | `/tailoring-requests/:id/generate` | Generate a fit analysis, resume draft, and cover letter |
| `GET` | `/tailoring-requests` | List the authenticated user's requests with `page` (default `1`) and `limit` (default `10`, maximum `100`). Returns the page's items and pagination metadata. |
| `GET` | `/tailoring-requests/:id` | Get a tailoring request |
| `PATCH` | `/tailoring-requests/:id` | Update job details or edit a generated result |
| `DELETE` | `/tailoring-requests/:id` | Delete a tailoring request |

## Tests

Run unit tests:

```bash
npm test
```

End-to-end tests use a separate PostgreSQL database. Create a test database, then create `.env.test.local` from `.env.example` and set `DATABASE_URL` to the test database. Dummy SMTP and Groq values are sufficient; the end-to-end tests mock those services.

Apply migrations to the test database and run the tests from Git Bash:

```bash
DOTENV_CONFIG_PATH=.env.test.local npx prisma migrate deploy
NODE_ENV=test npm run test:e2e
```

The tests cover authentication, ownership, validation and error responses, tailoring-request CRUD, pagination, and auth rate limiting. They do not test real email or AI provider behavior or a deployed environment.

## Security and performance

- Store secrets in environment variables; do not commit `.env` files.
- Passwords use Argon2 hashes. Verification codes are stored as HMAC hashes and expire; JWTs expire after 12 hours.
- Auth routes are rate-limited to five requests per minute per client IP. OTP resend also has a 60-second per-account cooldown.
- CORS origins are controlled by `CORS_ORIGINS`, which defaults to `http://localhost:3000`.
- Tailoring-request lists are paginated, with a maximum page size of 100. The database indexes requests by resume and creation time.

## Project documents

- [API specification](docs/api-specification.docx)
- [Architecture diagram](docs/architecture.md)
- [Issue log](docs/issue-log.md)
