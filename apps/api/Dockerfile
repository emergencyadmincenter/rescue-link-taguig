# ==============================================================================
# STAGE 1: Base Environment
# ==============================================================================
FROM node:20-alpine AS base
WORKDIR /app
# Install openssl needed for Prisma Client to run on Alpine Linux v3.x
RUN apk add --no-cache openssl

# ==============================================================================
# STAGE 2: Development / Full Dependency Installation
# ==============================================================================
FROM base AS dev
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ==============================================================================
# STAGE 3: Production Dependency Stripping
# ==============================================================================
FROM base AS prod-deps
COPY package*.json ./
# Install only runtime dependencies to keep the image lean
RUN npm ci --omit=dev

# ==============================================================================
# STAGE 4: App Compilation & Code Generation
# ==============================================================================
FROM base AS build
COPY package*.json ./
# We need devDependencies (Nest CLI, TS compiler) to execute the build
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ==============================================================================
# STAGE 5: Hardened Production Runner
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install openssl in production runner for Prisma compatibility
RUN apk add --no-cache openssl

# Create a clean data directory and transfer ownership to the low-privilege node user
RUN chown -R node:node /app

# Copy runtime node_modules and compiled code
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package*.json ./

# Drop root privileges and switch to the built-in secure non-root user
USER node

EXPOSE 3000

# Execute Node directly as PID 1 so OS signals (SIGTERM) pass straight to NestJS
CMD ["node", "dist/src/main"]