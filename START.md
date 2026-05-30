when user use -start <idea>

you as a orchestration must handle <idea> with this pipeline and delegate
to the team as @backend use /backend-development skill, @frontend use /vercel-react-best-practices skill, and @qa-engineer use /qa-engineer skill. all of you working on /app_build directory.
semua kebutuhan sudah ada di root project. ada @DESIGN.md, @DATABASE-DESIGN-DOCUMENT.md , @PRISMA-SCEMA.md dan /sequence-diagram yang bisa di gunakan.

PRD
 │
 ▼
Architecture Review
 │
 ▼
Database Design
 │
 ▼
Backend Agent
 │
 ▼
Backend Validation
 │
 ▼
Frontend Agent
 │
 ▼
Frontend Validation
 │
 ▼
Integration Review
 │
 ▼
QA Generation
 │
 ▼
Done

rules :
Feature <idea>:
  Backend
  Frontend
  QA
  Done


never use npm run build in development phase.