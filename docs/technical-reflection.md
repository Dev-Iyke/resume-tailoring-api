# Technical Reflection

Building this API helped me understand how backend features connect across the application. Designing the Prisma models and their relationships was one of the most challenging parts. When adding unfamiliar packages, I also had to consult their documentation to understand their configuration and role in the project.

I now have a clearer understanding of OTP verification, database relationships, and how DTOs and query parameters move from a request through a controller into a service. Working through these features made the structure of a NestJS application more concrete for me.

Future improvements include supporting multiple resumes per user and letting users select one for each tailoring request, generating a formatted resume document, and deploying the API. I would also evaluate a more reliable email delivery provider and refine the AI prompt to produce more ATS-aware results while keeping generated claims supported by the source resume.
