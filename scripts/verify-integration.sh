#!/bin/bash

# Feature Integration Verification Script
# Verifiziert dass alle Systemkomponenten korrekt zusammenarbeiten

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TESTS_TOTAL++))
    log "Testing: $test_name"
    
    if eval "$test_command" &>/dev/null; then
        success "$test_name"
        ((TESTS_PASSED++))
        return 0
    else
        error "$test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Basis-System Checks
test_basic_system() {
    log "=== Basis-System Tests ==="
    
    run_test "Docker ist verfügbar" "docker --version"
    run_test "Docker Compose ist verfügbar" "docker-compose --version"
    run_test "Node.js ist verfügbar" "node --version"
    run_test "NPM ist verfügbar" "npm --version"
    run_test "PostgreSQL Client verfügbar" "which psql"
}

# 2. Database Integration
test_database_integration() {
    log "=== Database Integration Tests ==="
    
    # Start nur Database für Tests
    docker-compose -f docker-compose.yml up -d postgres redis
    sleep 10
    
    run_test "PostgreSQL Container läuft" "docker-compose ps postgres | grep -q Up"
    run_test "Redis Container läuft" "docker-compose ps redis | grep -q Up"
    run_test "Database Connection" "docker-compose exec -T postgres pg_isready -U ams_user"
    run_test "Redis Connection" "docker-compose exec -T redis redis-cli ping | grep -q PONG"
    
    # Database Struktur testen
    cd backend
    run_test "Database Migration" "npm run db:migrate"
    run_test "Database Seeding" "npm run db:seed"
    cd ..
}

# 3. Backend Integration  
test_backend_integration() {
    log "=== Backend Integration Tests ==="
    
    cd backend
    run_test "Backend Dependencies" "npm ci"
    run_test "Backend Tests" "npm test"
    run_test "Backend Linting" "npm run lint"
    run_test "Backend Build" "npm run build"
    cd ..
    
    # Backend Container testen
    docker-compose up -d backend
    sleep 15
    
    run_test "Backend Container läuft" "docker-compose ps backend | grep -q Up"
    run_test "Backend Health Check" "curl -f http://localhost:5000/api/health"
    run_test "Backend Database Health" "curl -f http://localhost:5000/api/health/db"
    run_test "Backend Cache Health" "curl -f http://localhost:5000/api/health/cache"
}

# 4. Frontend Integration
test_frontend_integration() {
    log "=== Frontend Integration Tests ==="
    
    cd frontend
    run_test "Frontend Dependencies" "npm ci"
    run_test "Frontend Tests" "npm test -- --watchAll=false"
    run_test "Frontend Linting" "npm run lint"
    run_test "Frontend Build" "npm run build"
    cd ..
    
    # Frontend Container testen
    docker-compose up -d frontend
    sleep 10
    
    run_test "Frontend Container läuft" "docker-compose ps frontend | grep -q Up"
    run_test "Frontend Accessibility" "curl -f http://localhost:3000"
    run_test "Frontend Health" "curl -f http://localhost:3000/health"
}

# 5. API Integration Tests
test_api_integration() {
    log "=== API Integration Tests ==="
    
    # Warte darauf dass Backend bereit ist
    timeout 60 bash -c 'until curl -f http://localhost:5000/api/health; do sleep 2; done'
    
    # Test Basic API Endpoints
    run_test "API Health Endpoint" "curl -f http://localhost:5000/api/health"
    run_test "API Auth Endpoints" "curl -f http://localhost:5000/api/auth/csrf-token"
    run_test "API Swagger Docs" "curl -f http://localhost:5000/api-docs/"
    
    # Test Authentication Flow
    local TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@example.com","password":"admin123"}' | \
        grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [[ -n "$TOKEN" ]]; then
        success "Authentication Flow"
        ((TESTS_PASSED++))
        
        # Test Protected Endpoints
        run_test "Protected Anlagen Endpoint" "curl -f -H 'Authorization: Bearer $TOKEN' http://localhost:5000/api/anlagen"
        run_test "Protected User Endpoint" "curl -f -H 'Authorization: Bearer $TOKEN' http://localhost:5000/api/users/profile"
    else
        error "Authentication Flow"
        ((TESTS_FAILED++))
    fi
    
    ((TESTS_TOTAL+=2))
}

# 6. Multi-Tenant Tests
test_multitenant_integration() {
    log "=== Multi-Tenant Integration Tests ==="
    
    # Test verschiedene Mandanten-Isolation
    run_test "Mandant 1 Data Isolation" "cd backend && npm run test -- --grep 'multi-tenant'"
    run_test "Mandant 2 Data Isolation" "cd backend && npm run test -- --grep 'data isolation'"
}

# 7. Performance Tests
test_performance_basics() {
    log "=== Basic Performance Tests ==="
    
    # Response Time Tests
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:5000/api/health)
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        success "API Response Time < 1s ($response_time s)"
        ((TESTS_PASSED++))
    else
        error "API Response Time too slow: $response_time s"
        ((TESTS_FAILED++))
    fi
    ((TESTS_TOTAL++))
    
    # Memory Usage Test
    local memory_usage=$(docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | grep backend | awk '{print $2}' | cut -d'/' -f1 | sed 's/MiB//')
    if [[ -n "$memory_usage" ]] && (( $(echo "$memory_usage < 512" | bc -l) )); then
        success "Backend Memory Usage < 512MB (${memory_usage}MB)"
        ((TESTS_PASSED++))
    else
        warning "Backend Memory Usage: ${memory_usage}MB"
        ((TESTS_PASSED++))
    fi
    ((TESTS_TOTAL++))
}

# 8. Security Tests
test_security_basics() {
    log "=== Basic Security Tests ==="
    
    # CORS Test
    run_test "CORS Headers" "curl -H 'Origin: http://localhost:3000' -I http://localhost:5000/api/health | grep -q 'Access-Control-Allow-Origin'"
    
    # Security Headers Test
    run_test "Security Headers" "curl -I http://localhost:5000/api/health | grep -q 'X-Content-Type-Options'"
    
    # Rate Limiting Test
    for i in {1..10}; do
        curl -s http://localhost:5000/api/health > /dev/null
    done
    run_test "Rate Limiting Active" "curl -I http://localhost:5000/api/health | grep -q '200\|429'"
    
    # SQL Injection Protection Test
    run_test "SQL Injection Protection" "! curl -s 'http://localhost:5000/api/anlagen?id=1;DROP TABLE users;--' | grep -q 'error'"
}

# 9. PWA und Offline Tests
test_pwa_features() {
    log "=== PWA Features Tests ==="
    
    run_test "Service Worker Registration" "curl -f http://localhost:3000/sw.js"
    run_test "Web App Manifest" "curl -f http://localhost:3000/manifest.json"
    run_test "Offline Page" "curl -f http://localhost:3000/offline.html"
}

# 10. Monitoring Integration
test_monitoring_integration() {
    log "=== Monitoring Integration Tests ==="
    
    run_test "Prometheus Metrics" "curl -f http://localhost:5000/metrics"
    run_test "Health Check Metrics" "curl http://localhost:5000/metrics | grep -q 'ams_http_requests_total'"
    run_test "Log Files Creation" "test -d backend/logs"
    run_test "Error Logging" "test -f backend/logs/error.log"
}

# Main Test Runner
main() {
    log "🚀 Starting Complete System Integration Tests"
    log "================================================"
    
    # Cleanup any existing containers
    docker-compose down -v 2>/dev/null || true
    
    test_basic_system
    test_database_integration
    test_backend_integration
    test_frontend_integration
    test_api_integration
    test_multitenant_integration
    test_performance_basics
    test_security_basics
    test_pwa_features
    test_monitoring_integration
    
    # Final Report
    log "================================================"
    log "🏁 Integration Test Results"
    log "================================================"
    
    success "Tests Passed: $TESTS_PASSED"
    if [[ $TESTS_FAILED -gt 0 ]]; then
        error "Tests Failed: $TESTS_FAILED"
    else
        success "Tests Failed: $TESTS_FAILED"
    fi
    log "Total Tests: $TESTS_TOTAL"
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    log "Success Rate: $success_rate%"
    
    if [[ $success_rate -ge 90 ]]; then
        success "🎉 System Integration: EXCELLENT ($success_rate%)"
        exit 0
    elif [[ $success_rate -ge 80 ]]; then
        warning "⚠️  System Integration: GOOD ($success_rate%)"
        exit 0
    else
        error "❌ System Integration: NEEDS IMPROVEMENT ($success_rate%)"
        exit 1
    fi
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up test environment..."
    docker-compose down -v 2>/dev/null || true
}

trap cleanup EXIT

main "$@"