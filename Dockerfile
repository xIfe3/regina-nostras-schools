# Regina Nostra Schools: website + API in one container.
# Build:  docker build -t regina-nostra .
# Run:    docker run -p 5000:5000 --env-file backend/.env regina-nostra

# ---- 1. Build the website (React) ----
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. Build the API (TypeScript -> JavaScript) ----
FROM node:22-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ---- 3. Run: production dependencies + built files only ----
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=backend /app/backend/dist ./dist
COPY --from=frontend /app/frontend/dist /app/frontend/dist
# Temporary folder for spreadsheet uploads (results / student lists)
RUN mkdir -p uploads && chown -R node:node /app/backend/uploads
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["node", "dist/server.js"]
