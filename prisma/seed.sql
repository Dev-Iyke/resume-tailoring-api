BEGIN;

-- Local-only test account. Do not use this account in a deployed environment.
INSERT INTO "User" (
  "id", "full_name", "email", "password_hash", "status",
  "email_verified_at", "created_at", "updated_at"
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'Jamie Example',
  'jamie.example@example.test',
  '$argon2id$v=19$m=65536,p=4,t=3$tHyaHyT8sqYHnfb3Sf8c3w$xm/VyTZgRdlMuNtzp55lELQ6bQ8ivPJQ/bKt43Yq9zg',
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "full_name" = EXCLUDED."full_name",
  "email" = EXCLUDED."email",
  "password_hash" = EXCLUDED."password_hash",
  "status" = EXCLUDED."status",
  "email_verified_at" = EXCLUDED."email_verified_at";

INSERT INTO "Resume" (
  "id", "user_id", "text", "created_at", "updated_at"
) VALUES (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  E'Jamie Example\nEarly-career software developer\n\nSKILLS\nTypeScript, JavaScript, Node.js, REST APIs, PostgreSQL, Git\n\nPROJECT EXPERIENCE\nBuilt a task-tracking API with CRUD operations and input validation. Used a relational database and tested endpoints with API tools.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "user_id" = EXCLUDED."user_id",
  "text" = EXCLUDED."text";

COMMIT;
