# Multi-Stage Build für Backend
FROM node:18-alpine AS builder

# Arbeitsverzeichnis setzen
WORKDIR /app

# Package-Dateien kopieren
COPY package*.json ./

# Dependencies installieren (nur production)
RUN npm ci --only=production && npm cache clean --force

# Quellcode kopieren
COPY . .

# Build erstellen
RUN npm run build

# Production-Image
FROM node:18-alpine AS production

# Nicht-root Benutzer erstellen
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Arbeitsverzeichnis setzen
WORKDIR /app

# System-Dependencies installieren
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl

# Package-Dateien kopieren
COPY package*.json ./

# Nur Production-Dependencies installieren
RUN npm ci --only=production && npm cache clean --force

# Built application aus builder-Stage kopieren
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/src/migrations ./src/migrations
COPY --from=builder --chown=nodejs:nodejs /app/src/seeders ./src/seeders

# Logs-Verzeichnis erstellen
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Uploads-Verzeichnis erstellen
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Health-Check-Script kopieren
COPY --chown=nodejs:nodejs healthcheck.js ./

# Benutzer wechseln
USER nodejs

# Port exponieren
EXPOSE 5000

# Health Check konfigurieren
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Anwendung mit dumb-init starten
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]