#!/bin/bash

echo "=== ANLAGEN-MANAGEMENT-SYSTEM SECURITY CHECK ==="
echo "Started at: $(date)"
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check-Counter
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
FAILURES=0

# Funktion für Check-Ergebnisse
check_result() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ "$1" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$1" == "WARN" ]; then
        echo -e "${YELLOW}⚠ WARN${NC}: $2"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILURES=$((FAILURES + 1))
    fi
}

echo "1. ENVIRONMENT CONFIGURATION CHECKS"
echo "===================================="

# Check für sensible Daten in .env
if [ -f ".env" ]; then
    if grep -q "JWT_SECRET=your-secret-key" .env 2>/dev/null; then
        check_result "FAIL" "Default JWT_SECRET found in .env - MUST be changed!"
    else
        check_result "PASS" "JWT_SECRET appears to be customized"
    fi
    
    if grep -q "DB_PASSWORD=password" .env 2>/dev/null; then
        check_result "FAIL" "Default database password found - MUST be changed!"
    else
        check_result "PASS" "Database password appears to be customized"
    fi
fi

# Check für .env in .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    check_result "PASS" ".env is in .gitignore"
else
    check_result "FAIL" ".env is NOT in .gitignore - sensitive data may be exposed!"
fi

echo ""
echo "2. DEPENDENCY VULNERABILITY CHECKS"
echo "==================================="

# NPM Audit
echo "Running npm audit..."
NPM_AUDIT=$(npm audit --json 2>/dev/null)
VULNERABILITIES=$(echo "$NPM_AUDIT" | jq -r '.metadata.vulnerabilities // {}')
HIGH=$(echo "$VULNERABILITIES" | jq -r '.high // 0')
CRITICAL=$(echo "$VULNERABILITIES" | jq -r '.critical // 0')

if [ "$CRITICAL" -gt 0 ]; then
    check_result "FAIL" "Found $CRITICAL CRITICAL vulnerabilities"
elif [ "$HIGH" -gt 0 ]; then
    check_result "WARN" "Found $HIGH HIGH severity vulnerabilities"
else
    check_result "PASS" "No high or critical vulnerabilities found"
fi

echo ""
echo "3. API SECURITY CHECKS"
echo "======================"

# CORS-Konfiguration prüfen
if grep -r "cors({" src/ 2>/dev/null | grep -q "origin: true"; then
    check_result "FAIL" "CORS allows all origins - should be restricted!"
else
    check_result "PASS" "CORS origin appears to be restricted"
fi

# Rate Limiting prüfen
if grep -r "rateLimit" src/ 2>/dev/null | grep -q "windowMs"; then
    check_result "PASS" "Rate limiting is configured"
else
    check_result "WARN" "No rate limiting found - consider adding to prevent abuse"
fi

# Helmet.js prüfen
if grep -r "helmet()" src/ 2>/dev/null; then
    check_result "PASS" "Helmet.js security headers are configured"
else
    check_result "WARN" "Helmet.js not found - consider adding for security headers"
fi

echo ""
echo "4. AUTHENTICATION & AUTHORIZATION CHECKS"
echo "========================================"

# JWT-Konfiguration prüfen
if grep -r "expiresIn:" src/ 2>/dev/null | grep -q "30d"; then
    check_result "WARN" "JWT tokens expire after 30 days - consider shorter expiration"
else
    check_result "PASS" "JWT expiration appears reasonable"
fi

# Passwort-Hashing prüfen
if grep -r "bcrypt" src/ package.json 2>/dev/null; then
    check_result "PASS" "bcrypt is used for password hashing"
else
    check_result "FAIL" "bcrypt not found - passwords may not be properly hashed!"
fi

# Auth-Middleware prüfen
if find src/ -name "*.ts" -o -name "*.js" | xargs grep -l "auth.*middleware" 2>/dev/null | wc -l | grep -q -v "^0$"; then
    check_result "PASS" "Authentication middleware found"
else
    check_result "WARN" "No authentication middleware found"
fi

echo ""
echo "5. DATA VALIDATION & SANITIZATION"
echo "================================="

# Input-Validierung prüfen
if grep -r "joi\|yup\|express-validator" package.json src/ 2>/dev/null; then
    check_result "PASS" "Input validation library found"
else
    check_result "WARN" "No input validation library detected"
fi

# SQL-Injection-Schutz prüfen
if grep -r "raw(" src/ 2>/dev/null | grep -v "// safe" | grep -v "comment"; then
    check_result "WARN" "Raw SQL queries found - ensure they are parameterized"
else
    check_result "PASS" "No unsafe raw SQL queries detected"
fi

echo ""
echo "6. FILE UPLOAD SECURITY"
echo "======================="

# Datei-Upload-Limits prüfen
if grep -r "fileSize:" src/ 2>/dev/null | grep -q "limit"; then
    check_result "PASS" "File size limits are configured"
else
    check_result "WARN" "No file size limits found for uploads"
fi

# Dateityp-Validierung prüfen
if grep -r "mimetype\|fileFilter" src/ 2>/dev/null; then
    check_result "PASS" "File type validation found"
else
    check_result "WARN" "No file type validation found"
fi

echo ""
echo "7. LOGGING & MONITORING"
echo "======================="

# Sensitive Data in Logs prüfen
if grep -r "console.log.*password\|console.log.*token" src/ 2>/dev/null; then
    check_result "FAIL" "Potential sensitive data logging detected"
else
    check_result "PASS" "No obvious sensitive data logging found"
fi

# Error-Handling prüfen
if grep -r "catch.*console.error\|catch.*logger" src/ 2>/dev/null | wc -l | grep -q -v "^0$"; then
    check_result "PASS" "Error handling with logging found"
else
    check_result "WARN" "Limited error logging detected"
fi

echo ""
echo "8. DOCKER SECURITY"
echo "=================="

# Non-root User in Dockerfile prüfen
if [ -f "Dockerfile" ]; then
    if grep -q "USER node\|USER [0-9]" Dockerfile; then
        check_result "PASS" "Docker container runs as non-root user"
    else
        check_result "WARN" "Docker container may run as root user"
    fi
fi

# Security-Updates in Docker prüfen
if [ -f "Dockerfile" ] && grep -q "apt-get update.*upgrade\|apk update.*upgrade" Dockerfile; then
    check_result "PASS" "Docker image includes security updates"
else
    check_result "WARN" "Docker image may not include latest security updates"
fi

echo ""
echo "9. PRODUCTION READINESS"
echo "======================="

# NODE_ENV Check
if grep -r "NODE_ENV.*production" src/ docker-compose.yml 2>/dev/null; then
    check_result "PASS" "Production environment checks found"
else
    check_result "WARN" "No production environment checks found"
fi

# Debug-Mode Check
if grep -r "debug.*true\|DEBUG.*true" .env.example 2>/dev/null; then
    check_result "WARN" "Debug mode may be enabled in production"
else
    check_result "PASS" "Debug mode appears to be disabled"
fi

echo ""
echo "10. SSL/TLS CONFIGURATION"
echo "========================="

# HTTPS-Redirect prüfen
if grep -r "forceSSL\|requireHTTPS\|https.*redirect" src/ nginx.conf 2>/dev/null; then
    check_result "PASS" "HTTPS redirect/enforcement found"
else
    check_result "WARN" "No HTTPS enforcement found"
fi

# Secure Cookies prüfen
if grep -r "secure.*true.*cookie\|cookie.*secure.*true" src/ 2>/dev/null; then
    check_result "PASS" "Secure cookie flag is set"
else
    check_result "WARN" "Secure cookie flag may not be set"
fi

echo ""
echo "====================================="
echo "SECURITY CHECK SUMMARY"
echo "====================================="
echo "Total Checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Failed: ${RED}$FAILURES${NC}"
echo ""

if [ $FAILURES -gt 0 ]; then
    echo -e "${RED}CRITICAL SECURITY ISSUES FOUND!${NC}"
    echo "Please address all failed checks before deploying to production."
    exit 1
elif [ $WARNINGS -gt 5 ]; then
    echo -e "${YELLOW}Multiple security warnings detected.${NC}"
    echo "Review and address warnings to improve security posture."
    exit 0
else
    echo -e "${GREEN}Security check completed successfully!${NC}"
    echo "Continue monitoring and updating security measures."
    exit 0
fi