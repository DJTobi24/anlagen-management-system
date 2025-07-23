#!/bin/bash

# Deployment Script für Anlagen-Management-System
# Verwendung: ./scripts/deploy.sh [staging|production] [version]

set -e  # Exit bei Fehlern
set -u  # Exit bei undefined variables

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging-Funktion
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Hilfe anzeigen
show_help() {
    cat << EOF
Anlagen-Management-System Deployment Script

Verwendung: $0 [ENVIRONMENT] [VERSION]

ENVIRONMENT:
    staging     - Deploy to staging environment
    production  - Deploy to production environment

VERSION:
    latest      - Deploy latest version (default)
    v1.0.0      - Deploy specific version
    main        - Deploy from main branch
    develop     - Deploy from develop branch

Optionen:
    -h, --help      Zeige diese Hilfe
    -d, --dry-run   Dry-run ohne tatsächliches Deployment
    -b, --backup    Erstelle Backup vor Deployment
    --skip-tests    Überspringe Tests
    --rollback      Rollback zum vorherigen Deployment

Beispiele:
    $0 staging
    $0 production v1.0.0
    $0 staging --dry-run
    $0 production --backup
EOF
}

# Default-Werte
ENVIRONMENT=""
VERSION="latest"
DRY_RUN=false
CREATE_BACKUP=false
SKIP_TESTS=false
ROLLBACK=false

# Command-line Arguments parsen
while [[ $# -gt 0 ]]; do
    case $1 in
        staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -b|--backup)
            CREATE_BACKUP=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        v*)
            VERSION="$1"
            shift
            ;;
        *)
            if [[ -z "$ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            elif [[ "$VERSION" == "latest" ]]; then
                VERSION="$1"
            else
                error "Unbekannter Parameter: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validierung
if [[ -z "$ENVIRONMENT" ]] && [[ "$ROLLBACK" == false ]]; then
    error "Environment ist erforderlich (staging|production)"
    show_help
    exit 1
fi

if [[ "$ENVIRONMENT" != "staging" ]] && [[ "$ENVIRONMENT" != "production" ]] && [[ "$ROLLBACK" == false ]]; then
    error "Environment muss 'staging' oder 'production' sein"
    exit 1
fi

# Konfiguration laden
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment-spezifische Konfiguration
if [[ "$ENVIRONMENT" == "production" ]]; then
    ENV_FILE="$PROJECT_ROOT/.env.production"
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
    NAMESPACE="ams-production"
else
    ENV_FILE="$PROJECT_ROOT/.env.staging"
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.staging.yml"
    NAMESPACE="ams-staging"
fi

# Funktionen
check_prerequisites() {
    log "Prüfe Voraussetzungen..."
    
    # Docker prüfen
    if ! command -v docker &> /dev/null; then
        error "Docker ist nicht installiert"
        exit 1
    fi
    
    # Docker Compose prüfen
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose ist nicht installiert"
        exit 1
    fi
    
    # Environment-Datei prüfen
    if [[ ! -f "$ENV_FILE" ]]; then
        error "Environment-Datei nicht gefunden: $ENV_FILE"
        exit 1
    fi
    
    # Kubectl prüfen (falls K8s deployment)
    if [[ -f "$PROJECT_ROOT/k8s/namespace.yaml" ]]; then
        if ! command -v kubectl &> /dev/null; then
            error "kubectl ist nicht installiert, aber K8s-Manifeste gefunden"
            exit 1
        fi
    fi
    
    success "Voraussetzungen erfüllt"
}

create_backup() {
    if [[ "$CREATE_BACKUP" == true ]] || [[ "$ENVIRONMENT" == "production" ]]; then
        log "Erstelle Backup..."
        
        BACKUP_NAME="pre-deploy-$(date +%Y%m%d-%H%M%S)"
        
        # Database Backup
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
            pg_dump -U "${DB_USER:-ams_user}" "${DB_NAME:-anlagen_management}" > \
            "$PROJECT_ROOT/backups/${BACKUP_NAME}-database.sql"
        
        # File System Backup
        tar -czf "$PROJECT_ROOT/backups/${BACKUP_NAME}-files.tar.gz" \
            -C "$PROJECT_ROOT" uploads logs config
        
        success "Backup erstellt: $BACKUP_NAME"
    fi
}

run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Tests übersprungen"
        return
    fi
    
    log "Führe Tests aus..."
    
    # Backend Tests
    cd "$PROJECT_ROOT/backend"
    npm test
    
    # Frontend Tests
    cd "$PROJECT_ROOT/frontend"
    npm test -- --watchAll=false
    
    # Integration Tests
    cd "$PROJECT_ROOT"
    if [[ -f "tests/integration/run.sh" ]]; then
        ./tests/integration/run.sh
    fi
    
    success "Alle Tests erfolgreich"
}

build_images() {
    log "Baue Docker Images..."
    
    # Backend Image
    docker build -t "ams-backend:$VERSION" \
        --build-arg NODE_ENV="$ENVIRONMENT" \
        "$PROJECT_ROOT/backend"
    
    # Frontend Image
    docker build -t "ams-frontend:$VERSION" \
        --build-arg REACT_APP_VERSION="$VERSION" \
        --build-arg REACT_APP_ENV="$ENVIRONMENT" \
        "$PROJECT_ROOT/frontend"
    
    success "Images erfolgreich gebaut"
}

deploy_docker_compose() {
    log "Deploye mit Docker Compose..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Würde folgende Services starten:"
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config --services
        return
    fi
    
    # Stoppe alte Services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Starte neue Services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans
    
    # Warte auf Services
    log "Warte auf Services..."
    sleep 30
    
    success "Deployment mit Docker Compose abgeschlossen"
}

deploy_kubernetes() {
    log "Deploye zu Kubernetes..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Würde K8s-Manifeste anwenden"
        return
    fi
    
    # Environment-Variablen für Substitution setzen
    export ENVIRONMENT="$ENVIRONMENT"
    export VERSION="$VERSION"
    export NAMESPACE="$NAMESPACE"
    
    # Manifeste anwenden
    for manifest in "$PROJECT_ROOT/k8s"/*.yaml; do
        envsubst < "$manifest" | kubectl apply -f -
    done
    
    # Warte auf Rollout
    kubectl rollout status deployment/ams-backend -n "$NAMESPACE" --timeout=300s
    kubectl rollout status deployment/ams-frontend -n "$NAMESPACE" --timeout=300s
    
    success "Kubernetes Deployment abgeschlossen"
}

run_health_checks() {
    log "Führe Health Checks aus..."
    
    local MAX_ATTEMPTS=30
    local ATTEMPT=1
    local HEALTH_URL=""
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        HEALTH_URL="https://app.yourdomain.com/api/health"
    else
        HEALTH_URL="https://staging.yourdomain.com/api/health"
    fi
    
    while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
        log "Health Check Versuch $ATTEMPT/$MAX_ATTEMPTS..."
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            success "Health Check erfolgreich"
            return 0
        fi
        
        sleep 10
        ((ATTEMPT++))
    done
    
    error "Health Check fehlgeschlagen nach $MAX_ATTEMPTS Versuchen"
    return 1
}

rollback_deployment() {
    log "Führe Rollback durch..."
    
    if [[ -f "$PROJECT_ROOT/k8s/namespace.yaml" ]]; then
        # Kubernetes Rollback
        kubectl rollout undo deployment/ams-backend -n "$NAMESPACE"
        kubectl rollout undo deployment/ams-frontend -n "$NAMESPACE"
        
        kubectl rollout status deployment/ams-backend -n "$NAMESPACE"
        kubectl rollout status deployment/ams-frontend -n "$NAMESPACE"
    else
        # Docker Compose Rollback
        if [[ -f "$PROJECT_ROOT/docker-compose.backup.yml" ]]; then
            docker-compose -f "$PROJECT_ROOT/docker-compose.backup.yml" --env-file "$ENV_FILE" up -d
        else
            error "Keine Backup-Konfiguration für Rollback gefunden"
            exit 1
        fi
    fi
    
    success "Rollback abgeschlossen"
}

send_notification() {
    local STATUS="$1"
    local MESSAGE="$2"
    
    # Slack Notification (falls konfiguriert)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 AMS Deployment - $STATUS\\n$MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # Email Notification (falls konfiguriert)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$MESSAGE" | mail -s "AMS Deployment - $STATUS" "$NOTIFICATION_EMAIL"
    fi
}

cleanup() {
    log "Führe Cleanup durch..."
    
    # Alte Docker Images entfernen
    docker image prune -f
    
    # Alte Backups löschen (älter als 30 Tage)
    find "$PROJECT_ROOT/backups" -name "*.sql" -mtime +30 -delete
    find "$PROJECT_ROOT/backups" -name "*.tar.gz" -mtime +30 -delete
    
    success "Cleanup abgeschlossen"
}

# Main-Funktion
main() {
    log "Starte Deployment für $ENVIRONMENT (Version: $VERSION)"
    
    if [[ "$ROLLBACK" == true ]]; then
        rollback_deployment
        run_health_checks
        send_notification "SUCCESS" "Rollback für $ENVIRONMENT erfolgreich"
        exit 0
    fi
    
    check_prerequisites
    
    if [[ "$DRY_RUN" == false ]]; then
        create_backup
    fi
    
    run_tests
    build_images
    
    # Deployment-Methode wählen
    if [[ -f "$PROJECT_ROOT/k8s/namespace.yaml" ]]; then
        deploy_kubernetes
    else
        deploy_docker_compose
    fi
    
    if ! run_health_checks; then
        error "Health Checks fehlgeschlagen - initiiere Rollback"
        rollback_deployment
        send_notification "FAILED" "Deployment für $ENVIRONMENT fehlgeschlagen - Rollback durchgeführt"
        exit 1
    fi
    
    cleanup
    
    success "Deployment für $ENVIRONMENT erfolgreich abgeschlossen!"
    send_notification "SUCCESS" "Deployment für $ENVIRONMENT (Version: $VERSION) erfolgreich"
}

# Trap für Cleanup bei Fehlern
trap 'error "Deployment fehlgeschlagen!"; cleanup; exit 1' ERR

# Script ausführen
main "$@"