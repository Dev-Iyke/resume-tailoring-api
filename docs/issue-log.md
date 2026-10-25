# Issue Log

No Week 1 mentor feedback was received before Week 2 work began. Mentors were unavailable, so there was no feedback to address.

| Issue | Consideration | Resolution |
| --- | --- | --- |
| Duplicate registration returned an internal server error. | Check for an existing email before insertion, or translate the database unique-constraint error. A pre-check alone can race. | Catch Prisma `P2002` and return `409 Conflict` for an email already in use. |
| Verification codes needed protection against guessing and reuse. | Limit attempts, expire codes, and consume a code only once. | Store an HMAC of the code, expire it after 10 minutes, cap attempts at five, and consume it during verification. |
| Verification resend needed to avoid repeated email sends and account discovery. | Return different responses for unknown and pending accounts, or use a generic response with a cooldown. | Use a generic response and a 60-second resend cooldown. |
| Tailoring request routes could expose or modify another user's records. | Return `403` for another user's ID or make it indistinguishable from a missing record. | Apply the JWT guard, scope queries through the resume owner, and return `404` when the record is not owned by the caller. |
| Users had no API route to save or update their resume. | Require database setup outside the API, or add authenticated resume routes. | Add `POST /resumes`, `GET /resumes/me`, and `PATCH /resumes/me`; derive ownership from the JWT. |
| Multiline job descriptions pasted into Swagger caused JSON parse errors. | Change backend parsing or send a valid JSON string. | Keep the API's JSON contract and encode line breaks as `\\n` in raw Swagger JSON. Frontends can serialize textarea values with `JSON.stringify`. |
