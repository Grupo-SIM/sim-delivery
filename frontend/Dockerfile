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
ARG COMPANY_SLUG
ARG NODE_ENV=production
ARG BRANDING_REVISION=unversioned
ARG VITE_CDN_URL

ENV COMPANY_SLUG=${COMPANY_SLUG}
ENV NODE_ENV=${NODE_ENV}
ENV VITE_CDN_URL=${VITE_CDN_URL}

COPY . .
RUN --mount=type=secret,id=DATABASE_URL DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" bunx turbo -F frontend build

FROM nginx:stable-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/generated/product-preload.conf /etc/nginx/conf.d/00-product-preload.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# The HTTP config keeps SPA navigation separate from missing static assets.

EXPOSE 5173
