# API Architecture

```mermaid
flowchart LR
    client[Client or Swagger UI]

    subgraph backend[NestJS REST API]
        auth[Auth module<br/>Register, verify, login<br/>Issues JWT]
        resume[Resume module<br/>Create, view, update<br/>JWT required]
        requests[Tailoring requests module<br/>CRUD and ownership checks<br/>JWT required]
        shared[Shared handling<br/>JWT guard, input validation,<br/>standard error responses]
        dataAccess[Prisma service]
        email[Mail service]
    end

    auth --> dataAccess
    resume --> dataAccess
    requests --> dataAccess
    auth --> email --> smtp[SMTP email provider]
    dataAccess --> database[(PostgreSQL)]

    client -->|Register, verify, login| auth
    client -->|Protected calls use Bearer token| shared
    shared --> resume
    shared --> requests
```

```mermaid
erDiagram
    USER ||--o| EMAIL_VERIFICATION : has
    USER ||--o| RESUME : owns
    RESUME ||--o{ TAILORING_REQUEST : has
```

The API uses the JWT to identify the caller. Resume and tailoring-request operations are scoped to that user through the resume relationship.

When a resume or job description changes, requests with generated results are marked `STALE`. Their result and `generated_at` are retained until the user regenerates the result; successful generation replaces it and returns the request to `COMPLETED`.
