#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# KlawTax — Deployment Validation & Startup Script
# Phase 7.3 | Version 1.5
#
# This script validates the environment before deployment and starts the
# application via PM2. Run as the klawtax system user (not root).
#
# Usage:
#   ./deploy-validate.sh              # Validate only (no deploy)
#   ./deploy-validate.sh --deploy     # Validate then deploy
#   ./deploy-validate.sh --fresh      # First-time deploy (includes seeding)
#   ./deploy-validate.sh --rollback <commit>  # Roll back to a commit
#
# Prerequisites:
#   - Node.js ≥20 via nvm
#   - PM2 installed globally
#   - .env file populated at APP_DIR/backend/.env
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

APP_DIR="${APP_DIR:-/var/www/klawtax}"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
LOG_DIR="/var/log/klawtax"
PM2_APP="klawtax-api"
REQUIRED_NODE_VERSION="20"

MODE="${1:-}"
ROLLBACK_TARGET="${2:-}"

# ANSI colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

# ── Helpers ───────────────────────────────────────────────────────────────────

pass()  { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail()  { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; ((WARN++)); }
info()  { echo -e "  ${BLUE}→${NC} $1"; }
step()  { echo -e "\n${YELLOW}▸ $1${NC}"; }
abort() { echo -e "\n${RED}ABORT: $1${NC}\n"; exit 1; }

# ── Environment Validation ────────────────────────────────────────────────────

validate_environment() {
  step "ENVIRONMENT VALIDATION"

  # Node.js version
  if command -v node &>/dev/null; then
    NODE_VER=$(node -e "console.log(process.versions.node.split('.')[0])")
    if [[ "$NODE_VER" -ge "$REQUIRED_NODE_VERSION" ]]; then
      pass "Node.js v$(node --version) (≥ v${REQUIRED_NODE_VERSION} required)"
    else
      fail "Node.js v$(node --version) is too old — v${REQUIRED_NODE_VERSION}+ required"
    fi
  else
    fail "Node.js not found — install via nvm"
  fi

  # PM2
  command -v pm2 &>/dev/null \
    && pass "PM2 $(pm2 --version 2>/dev/null | head -1) installed" \
    || fail "PM2 not found — run: npm install -g pm2"

  # App directory
  [[ -d "$BACKEND_DIR" ]] \
    && pass "Backend directory exists: $BACKEND_DIR" \
    || fail "Backend directory not found: $BACKEND_DIR"

  # .env file
  if [[ -f "${BACKEND_DIR}/.env" ]]; then
    pass ".env file exists"
  else
    fail ".env file missing at ${BACKEND_DIR}/.env"
    info "Copy from: cp ${BACKEND_DIR}/.env.example ${BACKEND_DIR}/.env"
    return
  fi

  # Log directory
  if [[ -d "$LOG_DIR" ]]; then
    pass "Log directory exists: $LOG_DIR"
  else
    warn "Log directory missing: $LOG_DIR — creating"
    mkdir -p "$LOG_DIR" && pass "Log directory created" || fail "Could not create log directory"
  fi
}

# ── .env Variable Validation ──────────────────────────────────────────────────

validate_env_vars() {
  step "ENVIRONMENT VARIABLES"

  ENV_FILE="${BACKEND_DIR}/.env"
  [[ ! -f "$ENV_FILE" ]] && { warn ".env not found — skipping var checks"; return; }

  # Source .env safely (only KEY=VALUE lines)
  while IFS='=' read -r KEY VALUE; do
    [[ "$KEY" =~ ^#.*$ || -z "$KEY" ]] && continue
    export "${KEY}=${VALUE}" 2>/dev/null || true
  done < <(grep -v '^#' "$ENV_FILE" | grep '=')

  # Required critical vars
  REQUIRED_VARS=(
    "MONGODB_URI"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "NODE_ENV"
    "CLIENT_URL"
  )

  for VAR in "${REQUIRED_VARS[@]}"; do
    VALUE="${!VAR:-}"
    if [[ -n "$VALUE" ]]; then
      pass "${VAR} is set"
    else
      fail "${VAR} is empty or missing — REQUIRED"
    fi
  done

  # Important but non-fatal
  OPTIONAL_VARS=(
    "RAZORPAY_KEY_ID"
    "RAZORPAY_KEY_SECRET"
    "RAZORPAY_WEBHOOK_SECRET"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET"
    "REDIS_URL"
    "EMAIL_SMTP_HOST"
  )

  for VAR in "${OPTIONAL_VARS[@]}"; do
    VALUE="${!VAR:-}"
    if [[ -n "$VALUE" ]]; then
      pass "${VAR} is set"
    else
      warn "${VAR} is not set — feature may be limited"
    fi
  done

  # NODE_ENV should be production
  if [[ "${NODE_ENV:-}" == "production" ]]; then
    pass "NODE_ENV=production"
  elif [[ -n "${NODE_ENV:-}" ]]; then
    warn "NODE_ENV=${NODE_ENV} (expected 'production' for live deploy)"
  fi

  # JWT secrets should be long enough
  JWT_LEN=${#JWT_SECRET}
  [[ "$JWT_LEN" -ge 32 ]] \
    && pass "JWT_SECRET length=${JWT_LEN} (≥32 chars)" \
    || fail "JWT_SECRET too short (${JWT_LEN} chars, minimum 32)"
}

# ── Build Validation ──────────────────────────────────────────────────────────

validate_build() {
  step "BUILD VALIDATION"

  cd "$BACKEND_DIR"

  # dist/server.js must exist
  if [[ -f "dist/server.js" ]]; then
    DIST_AGE=$(( $(date +%s) - $(stat -c %Y dist/server.js) ))
    pass "dist/server.js exists (age: ${DIST_AGE}s)"
    [[ "$DIST_AGE" -gt 3600 ]] && warn "dist/server.js is >1 hour old — consider rebuilding"
  else
    fail "dist/server.js not found — run: npm run build"
    info "Building now..."
    if npm run build 2>&1; then
      pass "Build succeeded"
    else
      abort "Build failed — cannot deploy"
    fi
  fi

  # package.json must exist
  [[ -f "package.json" ]] \
    && pass "package.json present" \
    || fail "package.json missing"

  # ecosystem.config.js must exist
  [[ -f "ecosystem.config.js" ]] \
    && pass "ecosystem.config.js present" \
    || fail "ecosystem.config.js missing — PM2 cannot start"

  # node_modules must exist
  [[ -d "node_modules" ]] \
    && pass "node_modules directory exists" \
    || warn "node_modules missing — run: npm ci --omit=dev"
}

# ── Process State ─────────────────────────────────────────────────────────────

check_pm2_state() {
  step "PM2 PROCESS STATE"

  if ! command -v pm2 &>/dev/null; then
    warn "PM2 not found — skipping process check"
    return
  fi

  PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"${PM2_APP}\") | .pm2_env.status" 2>/dev/null || echo "not_found")

  case "$PM2_STATUS" in
    "online")
      pass "PM2: ${PM2_APP} is ONLINE"
      UPTIME=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"${PM2_APP}\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")
      RESTARTS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"${PM2_APP}\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
      info "Uptime since: $(date -d @$((UPTIME/1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo 'N/A')"
      info "Restart count: ${RESTARTS}"
      [[ "${RESTARTS:-0}" -gt 5 ]] && warn "Process has restarted ${RESTARTS} times — investigate logs"
      ;;
    "stopped")
      warn "PM2: ${PM2_APP} is STOPPED"
      ;;
    "errored")
      fail "PM2: ${PM2_APP} is in ERRORED state"
      info "Run: pm2 logs ${PM2_APP} --err --lines 50"
      ;;
    "not_found")
      warn "PM2: ${PM2_APP} process not found (not started yet)"
      ;;
    *)
      warn "PM2: ${PM2_APP} status=${PM2_STATUS}"
      ;;
  esac
}

# ── Connectivity Checks ───────────────────────────────────────────────────────

check_connectivity() {
  step "CONNECTIVITY CHECKS"

  # Check if API is responding locally
  LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:5000/api/v1/health 2>/dev/null || echo "000")

  if [[ "$LOCAL_STATUS" == "200" || "$LOCAL_STATUS" == "207" ]]; then
    pass "Local API responding: http://localhost:5000/api/v1/health → $LOCAL_STATUS"

    HEALTH_BODY=$(curl -s --max-time 5 http://localhost:5000/api/v1/health 2>/dev/null || echo "{}")
    DB_STATUS=$(echo "$HEALTH_BODY" | jq -r '.checks.database' 2>/dev/null || echo "unknown")
    CACHE_STATUS=$(echo "$HEALTH_BODY" | jq -r '.checks.cache' 2>/dev/null || echo "unknown")

    [[ "$DB_STATUS" == "ok" ]] \
      && pass "Database: connected (ok)" \
      || fail "Database: ${DB_STATUS} — check MONGODB_URI and Atlas network access"

    [[ "$CACHE_STATUS" == "ok" ]] \
      && pass "Cache: connected (ok)" \
      || info "Cache: ${CACHE_STATUS} (ok if Redis not configured)"
  else
    warn "Local API not responding (status: $LOCAL_STATUS) — app may not be running yet"
  fi

  # Check Nginx
  if command -v nginx &>/dev/null; then
    if nginx -t 2>/dev/null; then
      pass "Nginx config syntax valid"
    else
      fail "Nginx config has syntax errors — run: sudo nginx -t"
    fi
    NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "unknown")
    [[ "$NGINX_STATUS" == "active" ]] \
      && pass "Nginx service is active" \
      || warn "Nginx service: ${NGINX_STATUS}"
  else
    info "Nginx not found — skipping (may not be installed yet)"
  fi
}

# ── Deploy ────────────────────────────────────────────────────────────────────

do_deploy() {
  step "DEPLOYING"

  cd "$APP_DIR"

  # Pull latest code
  info "Pulling latest code..."
  git pull origin main || abort "git pull failed"
  pass "Code updated"

  # Backend
  info "Installing backend dependencies..."
  cd "$BACKEND_DIR"
  npm ci --omit=dev 2>&1 || abort "npm ci failed for backend"
  pass "Backend dependencies installed"

  info "Building backend..."
  npm run build 2>&1 || abort "Backend build failed"
  pass "Backend built"

  # Frontend
  if [[ -d "$FRONTEND_DIR" && -f "${FRONTEND_DIR}/package.json" ]]; then
    info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci 2>&1 || abort "npm ci failed for frontend"
    pass "Frontend dependencies installed"

    info "Building frontend..."
    npm run build 2>&1 || abort "Frontend build failed"
    pass "Frontend built"
  fi

  # Reload PM2
  cd "$BACKEND_DIR"
  info "Reloading PM2..."
  if pm2 show "$PM2_APP" &>/dev/null; then
    pm2 reload "$PM2_APP" --update-env
    pass "PM2 reloaded (zero-downtime)"
  else
    pm2 start ecosystem.config.js --env production
    pm2 save
    pass "PM2 started and saved"
  fi

  # Wait for readiness
  info "Waiting for readiness..."
  for i in {1..12}; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:5000/api/v1/health/ready 2>/dev/null || echo "000")
    if [[ "$STATUS" == "200" ]]; then
      pass "App is ready (health/ready → 200) after ${i}×5s"
      break
    fi
    sleep 5
    if [[ "$i" == "12" ]]; then
      fail "App did not become ready after 60s — check pm2 logs"
    fi
  done
}

do_fresh_deploy() {
  do_deploy

  step "FIRST-TIME SETUP"

  # Seed services catalog
  cd "$BACKEND_DIR"
  info "Seeding services catalog..."
  if npm run seed:prod 2>&1; then
    pass "Services catalog seeded"
  else
    warn "Seeding failed — you can retry with: npm run seed:prod"
  fi
}

do_rollback() {
  [[ -z "$ROLLBACK_TARGET" ]] && abort "Rollback target commit required: --rollback <commit-hash>"

  step "ROLLING BACK TO ${ROLLBACK_TARGET}"

  cd "$APP_DIR"
  git checkout "$ROLLBACK_TARGET" || abort "git checkout $ROLLBACK_TARGET failed"
  pass "Checked out $ROLLBACK_TARGET"

  cd "$BACKEND_DIR"
  npm ci --omit=dev || abort "npm ci failed"
  npm run build || abort "Build failed"
  pass "Rebuilt at $ROLLBACK_TARGET"

  pm2 reload "$PM2_APP" --update-env
  pass "PM2 reloaded"

  info "Verify: curl http://localhost:5000/api/v1/health/ready"
}

# ── Summary ───────────────────────────────────────────────────────────────────

print_summary() {
  echo ""
  echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
  echo -e "  Validation Summary: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}  ${YELLOW}${WARN} warnings${NC}"
  echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"

  if [[ "$FAIL" -eq 0 && "$WARN" -eq 0 ]]; then
    echo -e "\n  ${GREEN}✅ Environment is DEPLOYMENT-READY${NC}"
  elif [[ "$FAIL" -eq 0 ]]; then
    echo -e "\n  ${YELLOW}⚠️  Environment has warnings — review before deploying${NC}"
  else
    echo -e "\n  ${RED}❌ ${FAIL} check(s) FAILED — resolve before deploying${NC}"
  fi
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  KlawTax Deployment Validator${NC}"
echo -e "${BLUE}  Phase 7.3 | $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"

validate_environment
validate_env_vars
validate_build
check_pm2_state
check_connectivity

print_summary

case "$MODE" in
  "--deploy")
    [[ "$FAIL" -gt 0 ]] && abort "Cannot deploy — ${FAIL} validation check(s) failed"
    do_deploy
    echo ""
    info "Running smoke tests..."
    bash "$(dirname "$0")/smoke-test.sh" "http://localhost:5000" || warn "Some smoke tests failed — review"
    ;;
  "--fresh")
    [[ "$FAIL" -gt 0 ]] && abort "Cannot deploy — ${FAIL} validation check(s) failed"
    do_fresh_deploy
    echo ""
    info "Running smoke tests..."
    bash "$(dirname "$0")/smoke-test.sh" "http://localhost:5000" || warn "Some smoke tests failed — review"
    ;;
  "--rollback")
    do_rollback
    ;;
  "")
    info "Run with --deploy to deploy, --fresh for first deploy, --rollback <hash> to roll back"
    ;;
esac
