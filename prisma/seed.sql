BEGIN;

-- Placeholder only; authentication is not implemented.
INSERT INTO "User" (
  "id", "full_name", "email", "password_hash", "created_at", "updated_at"
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Jamie Example',
  'jamie.example@example.test',
  'dummy-placeholder-not-a-real-password-hash',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Resume" (
  "id", "user_id", "text", "created_at", "updated_at"
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  E'Jamie Example\nEarly-career software developer\n\nSKILLS\nTypeScript, JavaScript, Node.js, REST APIs, PostgreSQL, Git\n\nPROJECT EXPERIENCE\nBuilt a task-tracking API with CRUD operations and input validation. Used a relational database and tested endpoints with API tools.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
