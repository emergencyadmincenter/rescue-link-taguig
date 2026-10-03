# RescueLink Taguig

> ### 🏆 Project Team & Client
> **Client:** Command Center Taguig
>
> **Project Lead:** Arjohn Banado  
> **UI/UX & Design:** Arjohn Banado  
> **Frontend Developers:** Arjohn Banado, John Lawrence Amihan  
> **Backend Developers:** Arjohn Banado, John Lawrence Amihan, Mark Dennis Concha, Bob Geof Tortogo  
> **Cloud Architecture & CI/CD Setup:** Arjohn Banado  
> **Documentation:** Arjohn Banado, John Lawrence Amihan, Mark Dennis Concha, Bob Geof Tortogo  

RescueLink Taguig is a comprehensive emergency response, incident logging, and civilian coordination platform designed to streamline communication between residents and emergency response agencies (Police, Fire, Medical, DRRMO) in Taguig City. 

The system provides real-time incident mapping, weather and flood-risk monitoring, WebSocket-based internal messaging, role-based access control, and dynamic resource coordination.

## 🏗 System Architecture

This project is built as an npm workspace monorepo containing the following core technologies:

- **Frontend (`apps/web`)**: [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS v4, custom Design System, React-Leaflet (GeoJSON maps).
- **Backend (`apps/api`)**: [NestJS](https://nestjs.com/), TypeScript, Socket.IO (WebSockets).
- **Database**: PostgreSQL managed via [Prisma ORM](https://www.prisma.io/).
- **Tooling**: ESLint, Prettier, TypeScript, Docker.

## ☁️ Infrastructure & Deployment

We designed the infrastructure to guarantee high availability, strict security, and a frictionless developer experience from local testing all the way to production.

### Local Development Environment
To streamline the setup of the development environment and reduce collaboration friction across the team, we fully utilize **Docker**. The backend API and the PostgreSQL database are containerized locally, complete with an isolated internal network. This ensures every developer can spin up an identical, working environment instantly without manual dependency configuration.

### Live Production Architecture
Our production environment is deployed using a highly scalable, enterprise-grade cloud architecture leveraging **AWS** and **Vercel**:

- **Frontend Hosting:** Deployed globally via **Vercel** to take full advantage of Next.js edge caching and serverless functions. Custom domains are connected and managed through **Hostinger**.
- **Container Registry & Backend Hosting:** Our NestJS backend is containerized, stored securely in **AWS ECR** (Elastic Container Registry), and deployed serverlessly using **AWS ECS** (Elastic Container Service) running on **AWS Fargate**.
- **Managed Database:** Production data is securely stored in a highly available **AWS RDS** (Relational Database Service) PostgreSQL instance.
- **Cloud Storage:** All application files, uploads, and incident imagery are managed securely via **AWS S3**.
- **Traffic Routing:** An **AWS Application Load Balancer** securely routes incoming traffic to our ECS containers, fully integrated with our custom domains.
- **Security & Networking:** The cloud architecture is strictly secured using custom VPC configurations, locked-down inbound/outbound rules, and dedicated AWS Security Groups to ensure resources like the database are completely isolated from public access.

## 📂 Monorepo Structure

```text
rescue-link-taguig/
├── apps/
│   ├── api/                # NestJS backend API (Port 3001)
│   └── web/                # Next.js frontend web application (Port 3000)
├── packages/
│   └── shared-schemas/     # Shared Zod schemas, DTOs, and constants
├── docs/                   # Architecture, onboarding, and decision notes
├── infra/                  # Docker compose and infrastructure configuration
└── AGENTS.md               # AI development rules and architectural guidelines
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18+ recommended)
- **npm** (v9+)
- **Docker & Docker Compose** (for running the local environment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/rescue-link-taguig.git
   cd rescue-link-taguig
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Duplicate the example environment files in both applications and populate the required secrets:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. **Initialize the Database:**
   Start the database container and apply Prisma migrations:
   ```bash
   # Start the local Docker environment (DB + API)
   npm run dev:backend
   
   # Run migrations and seed the database
   cd apps/api
   npx prisma migrate dev
   npm run seed
   cd ../../
   ```

### Running the Application

From the repository root, you can start the development servers using the following commands:

- **Start both Frontend and Backend concurrently:**
  ```bash
  npm run dev
  ```
- **Start only the Backend via Docker (API + DB):**
  ```bash
  npm run dev:backend
  ```
- **Start only the Frontend (Next.js):**
  ```bash
  npm run dev:frontend
  ```

Once running, the web application will be accessible at `http://localhost:3000` and the API at `http://localhost:3001`.

## 🛠 Development Guidelines

- **Design System:** The frontend utilizes a strict design system located at `apps/web/src/design-system/`. Always use provided CSS tokens (e.g., `bg-primary`, `text-display-large`) instead of hardcoding arbitrary Tailwind values.
- **AI Development:** Review `AGENTS.md` before making architectural or UI changes. It contains strict rules regarding UI/UX principles, API conventions, and system integrations.
- **Database Changes:** Any schema changes must be made in `apps/api/prisma/schema.prisma`. Run `npx prisma migrate dev --name <migration-name>` to apply and generate the Prisma Client. Rebuild `packages/shared-schemas` if necessary.

## 🔒 Security & Secrets

- **Never commit `.env` files.**
- Role-based access control (RBAC) is enforced at the API level via `@Roles()` and `@Permissions()` decorators.
- Storage keys and AWS credentials must strictly reside in the backend environment context.
