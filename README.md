# RescueLink Taguig

<div align="center">
  A comprehensive emergency response, incident logging, and civilian coordination platform designed to streamline communication between residents and emergency response agencies (Police, Fire, Medical, DRRMO) in Taguig City.
</div>

<br />

<div align="center">
  <strong>🌐 Live Site: <a href="https://rescuelinktaguig.com">rescuelinktaguig.com</a></strong>
</div>

<br />

<div align="center">
  <!-- Core Frameworks -->
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <br />
  <!-- Database, APIs, & Tools -->
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma" />
  <br />
  <!-- Infra & DevOps -->
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white" alt="AWS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

<br />

## Showcase

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Dashboard+Screenshot+Here" alt="RescueLink Dashboard" width="100%" />
  <br />
  <em>Real-time Incident Map and Coordination Dashboard</em>
  <br /><br />
  <img src="https://via.placeholder.com/800x450?text=App+Walkthrough+GIF+Here" alt="Application Walkthrough" width="100%" />
  <br />
  <em>WebSocket-powered live chat and resource tracking</em>
</div>

## Client & Project Team

**Client:** Command Center Taguig

| Team Member              | Roles & Contributions                                                         |
| :----------------------- | :---------------------------------------------------------------------------- |
| **Arjohn Banado**        | Project Lead, UI/UX Design, Full-Stack Development, Cloud Architecture, CI/CD |
| **John Lawrence Amihan** | Frontend Development, Backend Development, Documentation                      |
| **Mark Dennis Concha**   | Backend Development, Documentation                                            |
| **Bob Geof Tortogo**     | Backend Development, Documentation                                            |

## Key Features

- **Real-time Incident Mapping:** Geo-spatial incident plotting using React-Leaflet and GeoJSON data.
- **Unified Communications:** WebSocket-powered internal messaging and live emergency coordination.
- **Weather & Flood Risk Monitoring:** Live weather data integrations combined with local risk assessments.
- **Granular RBAC:** Deeply integrated Role-Based Access Control securing specific API endpoints and frontend views.
- **Dynamic Resource Coordination:** Live tracking and assignment of emergency resources across agencies.

## Architecture & Infrastructure

RescueLink Taguig operates as an enterprise-grade NPM workspace monorepo leveraging a cloud-native architecture:

### Tech Stack

- **Frontend (`apps/web`):** Next.js (App Router), React, Tailwind CSS v4, Custom Design System.
- **Backend (`apps/api`):** NestJS, TypeScript, Socket.IO.
- **Database:** PostgreSQL managed via Prisma ORM.

### Cloud Deployment

- **Frontend Delivery:** Deployed on Vercel's Edge Network for global caching and serverless execution, with DNS managed via Hostinger.
- **Backend Execution:** Containerized via AWS ECR and executed serverlessly on AWS ECS (Fargate).
- **Data & Storage:** Highly-available AWS RDS (PostgreSQL) residing in a secure private subnet, and AWS S3 for object and media storage.
- **Traffic Routing:** Managed by an AWS Application Load Balancer (ALB) securely forwarding HTTPS traffic to the ECS containers.

## 🤖 AI-Assisted Development & Tooling

To rapidly accelerate development, ensure high code quality, and craft a polished user experience, this project strategically leveraged modern AI models alongside specialized engineering tools:

### AI Models Used

- **Claude Opus:** Deep debugging assistance, feature feasibility analysis, testing strategies, and collaborative comprehensive code generation.
- **Gemini:** Rapid generation of repetitive boilerplate, filler code, dynamic image creation, and content manipulation.
- **ChatGPT Codex:** Researching complex architectural features and engaging in comprehensive web app technical discussions.
- **Recraft.ai:** File conversion and intelligent media content manipulation.

### Design & Engineering Tools

- **Figma & Canva:** UI/UX planning, asset creation, and strict design system compilation.
- **Dbdiagram.io:** Rendering the massive PostgreSQL Entity-Relationship Diagrams (ERD).
- **Swagger UI:** Visualizing and interacting with the OpenAPI REST specifications.
- **Structurizr (C4 Models):** Mapping strict software architecture context and cloud deployment diagrams.

## 📚 Documentation & Visuals

The `docs/` directory contains crucial architectural context and system models.

### 1. System Architecture (C4 Model)

Built using Structurizr DSL (`docs/architecture/workspace.dsl`).
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=C4+Architecture+Diagram+Here" alt="C4 Architecture" width="100%" />
</div>

### 2. Database Schema (ERD)

Built using DBML for Dbdiagram.io (`docs/database/erd.dbml`).
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Database+ERD+Screenshot+Here" alt="Database ERD" width="100%" />
</div>

### 3. API Specification (OpenAPI/Swagger)

Standardized OpenAPI 3.0 specs (`docs/api/openapi.yaml`).
<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Swagger+UI+Screenshot+Here" alt="Swagger UI" width="100%" />
</div>
<br />

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+)
- Docker & Docker Compose (for local database and API containerization)

### Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/your-org/rescue-link-taguig.git
   cd rescue-link-taguig
   npm install
   ```

1. **Environment Configuration**
   Copy the example environment files and configure your local secrets (ensure `DATABASE_URL` matches your Docker setup).

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

1. **Initialize the Database**
   Start the local backend services (API + DB) and run Prisma migrations.

   ```bash
   npm run dev:backend
   cd apps/api
   npx prisma migrate dev
   npm run seed
   cd ../../
   ```

1. **Run the Application**
   ```bash
   # Run both Frontend and Backend concurrently
   npm run dev
   ```
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:3001`

---

_RescueLink Taguig - Empowering rapid response and community safety._
