#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# KlawTax — Production Smoke Test Script
# Phase 7.3 | Version 1.5
#
# Usage:
#   ./smoke-test.sh                           # Test localhost (default)
#   ./smoke-test.sh https://api.klawtax.online  # Test production
#   API_URL=https://api.klawtax.online ./smoke-test.sh
#
# Prerequisites:
#   curl, jq
#
# Exit codes:
#   0 — All tests passed
#   1 — One or more tests failed
# ══════════════════════════════════════════════════════════════════════════════

set -uo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

API_URL="${1:-${API_URL:-http://localhost:5000}}"
TIMEOUT=10
PASS=0
FAIL=0

# ANSI colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

# ── Helpers ───────────────────────────────────────────────────────────────────

pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
info() { echo -e "  ${BLUE}→${NC} $1"; }
section() { echo -e "\n${YELLOW}▸ $1${NC}"; }

# HTTP call: returns status code
http_status() {
  curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$@"
}

# HTTP call: returns body
http_body() {
  curl -s --max-time "$TIMEOUT" "$@"
}

# ── Connectivity Preflight ────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  KlawTax Production Smoke Test${NC}"
echo -e "${BLUE}  Target: ${API_URL}${NC}"
echo -e "${BLUE}  $(date -u '+%Y-%m-%d %H:%M:%S UTC')${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"

section "PREFLIGHT — Connectivity"

STATUS=$(http_status "${API_URL}/api/v1/health" 2>/dev/null || echo "000")
if [[ "$STATUS" == "200" || "$STATUS" == "207" ]]; then
  pass "API reachable at ${API_URL}"
else
  fail "API not reachable (status: ${STATUS}) — aborting further tests"
  echo ""
  echo -e "${RED}SMOKE TEST ABORTED — API is not reachable.${NC}"
  exit 1
fi

# ── Health Endpoints ──────────────────────────────────────────────────────────

section "HEALTH ENDPOINTS"

# Liveness
STATUS=$(http_status "${API_URL}/api/v1/health/live")
[[ "$STATUS" == "200" ]] && pass "GET /health/live → 200" || fail "GET /health/live → expected 200, got $STATUS"

# Readiness
STATUS=$(http_status "${API_URL}/api/v1/health/ready")
[[ "$STATUS" == "200" ]] && pass "GET /health/ready → 200 (DB connected)" || fail "GET /health/ready → expected 200, got $STATUS (DB may not be connected)"

# Main health
BODY=$(http_body "${API_URL}/api/v1/health")
HEALTH_STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "parse_error")
DB_STATUS=$(echo "$BODY" | jq -r '.checks.database' 2>/dev/null || echo "parse_error")
CACHE_STATUS=$(echo "$BODY" | jq -r '.checks.cache' 2>/dev/null || echo "parse_error")

[[ "$HEALTH_STATUS" != "parse_error" ]] && pass "GET /health → parseable JSON" || fail "GET /health → invalid JSON response"
[[ "$DB_STATUS" == "ok" ]] && pass "Health: database=ok" || fail "Health: database=$DB_STATUS (expected ok)"
[[ "$CACHE_STATUS" == "ok" || "$CACHE_STATUS" == "not_configured" || "$CACHE_STATUS" == "degraded" ]] \
  && pass "Health: cache=$CACHE_STATUS (acceptable)" \
  || fail "Health: cache=$CACHE_STATUS (unexpected)"

info "Environment: $(echo "$BODY" | jq -r '.environment' 2>/dev/null)"
info "Version: $(echo "$BODY" | jq -r '.version' 2>/dev/null)"

# ── Public Endpoints ──────────────────────────────────────────────────────────

section "PUBLIC ENDPOINTS"

# Services list
BODY=$(http_body "${API_URL}/api/v1/services")
SVC_COUNT=$(echo "$BODY" | jq 'if type == "array" then length elif .data then (.data | length) else 0 end' 2>/dev/null || echo "0")
[[ "$SVC_COUNT" -ge 20 ]] \
  && pass "GET /api/v1/services → $SVC_COUNT services returned" \
  || fail "GET /api/v1/services → expected ≥20 services, got $SVC_COUNT"

# Featured package
STATUS=$(http_status "${API_URL}/api/v1/services/section-8-complete-package")
[[ "$STATUS" == "200" ]] && pass "GET /api/v1/services/section-8-complete-package → 200" || fail "GET /api/v1/services/section-8-complete-package → $STATUS"

# Contact/lead capture (non-destructive POST with validation error expected)
BODY=$(http_body -X POST "${API_URL}/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{}')
STATUS=$(http_status -X POST "${API_URL}/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo "000")
# Expect 400 (validation error) — 404 would mean route missing
[[ "$STATUS" == "400" || "$STATUS" == "422" ]] \
  && pass "POST /api/v1/contact → $STATUS (route reachable, validates input)" \
  || fail "POST /api/v1/contact → $STATUS (expected 400/422 for empty body)"

# ── Authentication ────────────────────────────────────────────────────────────

section "AUTHENTICATION"

# Login with invalid creds — should get 401, not 500
BODY=$(http_body -X POST "${API_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.invalid","password":"WrongPassword1!"}')
STATUS=$(http_status -X POST "${API_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.invalid","password":"WrongPassword1!"}' 2>/dev/null || echo "000")
[[ "$STATUS" == "401" || "$STATUS" == "400" ]] \
  && pass "POST /api/v1/auth/login (invalid creds) → $STATUS (auth working)" \
  || fail "POST /api/v1/auth/login → $STATUS (expected 401)"

# Protected endpoint without token — should get 401
STATUS=$(http_status "${API_URL}/api/v1/admin/settings")
[[ "$STATUS" == "401" ]] \
  && pass "GET /api/v1/admin/settings (no token) → 401 (auth guard working)" \
  || fail "GET /api/v1/admin/settings (no token) → $STATUS (expected 401)"

# Forgot password — valid email format, rate-limited endpoint
STATUS=$(http_status -X POST "${API_URL}/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@test.invalid"}')
[[ "$STATUS" == "200" || "$STATUS" == "429" ]] \
  && pass "POST /api/v1/auth/forgot-password → $STATUS (endpoint reachable)" \
  || fail "POST /api/v1/auth/forgot-password → $STATUS (unexpected)"

# Refresh without token — should 401
STATUS=$(http_status -X POST "${API_URL}/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{}')
[[ "$STATUS" == "401" || "$STATUS" == "400" ]] \
  && pass "POST /api/v1/auth/refresh (no token) → $STATUS" \
  || fail "POST /api/v1/auth/refresh (no token) → $STATUS (expected 401)"

# ── RBAC Enforcement ──────────────────────────────────────────────────────────

section "RBAC ENFORCEMENT"

ADMIN_ROUTES=(
  "/api/v1/admin/settings"
  "/api/v1/admin/jobs"
  "/api/v1/admin/webhooks"
  "/api/v1/users"
)

for ROUTE in "${ADMIN_ROUTES[@]}"; do
  STATUS=$(http_status "${API_URL}${ROUTE}")
  [[ "$STATUS" == "401" ]] \
    && pass "GET ${ROUTE} (no token) → 401" \
    || fail "GET ${ROUTE} (no token) → $STATUS (expected 401)"
done

# ── Webhook Endpoint ──────────────────────────────────────────────────────────

section "WEBHOOK ENDPOINT"

# Razorpay webhook without signature should return 200 (per spec — never 4xx to Razorpay)
BODY=$(http_body -X POST "${API_URL}/api/v1/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test"}}}}')
STATUS=$(http_status -X POST "${API_URL}/api/v1/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test"}}}}' 2>/dev/null || echo "000")
[[ "$STATUS" == "200" ]] \
  && pass "POST /api/v1/webhooks/razorpay (no sig) → 200 (spec-correct — logs as skipped)" \
  || fail "POST /api/v1/webhooks/razorpay → $STATUS (expected 200)"

# ── Rate Limiting ─────────────────────────────────────────────────────────────

section "RATE LIMITING"

info "Sending 6 rapid requests to auth/login (should trigger rate limit at threshold)..."
RL_HIT=false
for i in {1..6}; do
  STATUS=$(http_status -X POST "${API_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"rl@test.invalid","password":"Bad1!"}' 2>/dev/null || echo "000")
  if [[ "$STATUS" == "429" ]]; then
    RL_HIT=true
    break
  fi
done

$RL_HIT \
  && pass "Rate limiting: 429 triggered after repeated auth attempts" \
  || fail "Rate limiting: 429 NOT triggered — check rate limit config"

# ── Response Headers ──────────────────────────────────────────────────────────

section "RESPONSE HEADERS"

HEADERS=$(curl -s -I --max-time "$TIMEOUT" "${API_URL}/api/v1/health")

echo "$HEADERS" | grep -qi "x-content-type-options" \
  && pass "Header: X-Content-Type-Options present" \
  || fail "Header: X-Content-Type-Options missing (Helmet may not be active)"

echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy" \
  && pass "Header: X-Frame-Options or CSP present" \
  || fail "Header: X-Frame-Options / CSP missing"

# Should NOT expose X-Powered-By
echo "$HEADERS" | grep -qi "x-powered-by" \
  && fail "Header: X-Powered-By exposed (should be hidden)" \
  || pass "Header: X-Powered-By not exposed"

# Should have X-Request-ID
echo "$HEADERS" | grep -qi "x-request-id" \
  && pass "Header: X-Request-ID present (request tracing active)" \
  || fail "Header: X-Request-ID missing"

# ── 404 Handling ──────────────────────────────────────────────────────────────

section "ERROR HANDLING"

STATUS=$(http_status "${API_URL}/api/v1/this-route-does-not-exist")
[[ "$STATUS" == "404" ]] \
  && pass "GET /api/v1/nonexistent → 404 (not 500)" \
  || fail "GET /api/v1/nonexistent → $STATUS (expected 404)"

BODY=$(http_body "${API_URL}/api/v1/this-route-does-not-exist")
echo "$BODY" | jq -e '.message' > /dev/null 2>&1 \
  && pass "404 response has JSON body with message field" \
  || fail "404 response is not structured JSON"

# ── Results Summary ───────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "  Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"

if [[ "$FAIL" -eq 0 ]]; then
  echo -e "\n  ${GREEN}✅ ALL SMOKE TESTS PASSED — deployment is production-ready${NC}\n"
  exit 0
else
  echo -e "\n  ${RED}❌ ${FAIL} SMOKE TEST(S) FAILED — review output above before going live${NC}\n"
  exit 1
fi
