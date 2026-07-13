# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.12 AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY packages/sql/package.json packages/sql/package.json

RUN bun i --frozen-lockfile --linker=isolated

FROM deps AS build

WORKDIR /app

# Branding is queried from Prisma during the build, never at first render.
ARG DATABASE_URL
ARG VITE_COMPANY_SLUG
ARG NODE_ENV=production

ENV DATABASE_URL=${DATABASE_URL}
ENV VITE_COMPANY_SLUG=${VITE_COMPANY_SLUG}
ENV NODE_ENV=${NODE_ENV}

COPY . .
RUN bunx turbo -F frontend build

FROM ghcr.io/static-web-server/static-web-server:2 AS runtime

COPY --from=build /app/frontend/dist /public

# Scratch-based static binary: no OS packages, so ~no CVEs.
ENV SERVER_ROOT=/public
ENV SERVER_PORT=3000
# SPA fallback: client-side routing handles unknown paths.
ENV SERVER_FALLBACK_PAGE=/public/index.html

EXPOSE 3000
