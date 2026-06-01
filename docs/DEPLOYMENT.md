# KlawTax — Production Deployment Guide
## Version 1.5 | Phase 7.2

This guide covers deploying KlawTax on an **Ubuntu 22.04 VPS** with **Nginx reverse proxy**, **PM2 process management**, and **MongoDB Atlas** for the database.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Ubuntu VPS | 22.04 LTS | 1 GB RAM minimum; 2 GB recommended |
| Node.js | ≥ 20 | Install via nvm (see below) |
| PM2 | latest | Process manager |
| Nginx | 1.18+ | Reverse proxy + SSL |
| Certbot | latest | Free SSL via Let's Encrypt |
| MongoDB Atlas | M10+ | Cloud database (not self-hosted) |
| Domain | configured | DNS A record pointing to VPS IP |

---

## 1. Server Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y git curl wget unzip nginx certbot python3-certbot-nginx

# Create application user (never run Node as root)
sudo useradd -m -s /bin/bash klawtax
sudo mkdir -p /var/www/klawtax
sudo chown klawtax:klawtax /var/www/klawtax

# Create log directory
sudo mkdir -p /var/log/klawtax
sudo chown klawtax:klawtax /var/log/klawtax
```

---

## 2. Install Node.js (via nvm)

```bash
# As the klawtax user:
sudo -u klawtax -i
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version   # should print v20.x.x
npm install -g pm2
pm2 --version
exit
```

---

## 3. Clone & Configure the Project

```bash
sudo -u klawtax -i
cd /var/www/klawtax
git clone https://github.com/your-org/klawtax.git .

# ── Backend ──
cd /var/www/klawtax/backend
cp .env.example .env
nano .env    # Fill in all required values (see .env.example comments)
```

Required values to fill in `.env`:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `JWT_SECRET` — 64-char random hex (generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- `JWT_REFRESH_SECRET` — different 64-char random hex
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET`
- `EMAIL_SMTP_*` settings
- `CLIENT_URL=https://klawtax.online`
- `REDIS_URL` — Upstash Redis URL

```bash
# ── Frontend ──
cd /var/www/klawtax/frontend
cp .env.example .env.production
nano .env.production    # Set VITE_API_BASE_URL=https://api.klawtax.online
```

---

## 4. Build & Seed

```bash
# ── Backend ──
cd /var/www/klawtax/backend
npm ci --omit=dev
npm run build

# Verify build succeeded
node dist/server.js &
curl http://localhost:5000/api/v1/health
kill %1

# Seed services catalog (run ONCE on first deployment)
npm run seed

# ── Frontend ──
cd /var/www/klawtax/frontend
npm ci
npm run build
# Output in: /var/www/klawtax/frontend/dist/
```

---

## 5. PM2 Process Management

```bash
cd /var/www/klawtax/backend

# Start with PM2
pm2 start ecosystem.config.js --env production

# Verify it's running
pm2 status
pm2 logs klawtax-api --lines 50

# Save process list so it persists across server reboots
pm2 save

# Enable PM2 to start on system boot
# Run this command and follow the instructions it prints:
pm2 startup
```

---

## 6. Nginx Configuration

### API (backend)

```bash
sudo nano /etc/nginx/sites-available/klawtax-api
```

```nginx
# /etc/nginx/sites-available/klawtax-api
server {
    listen 80;
    server_name api.klawtax.online;

    # Redirect HTTP → HTTPS (added automatically by certbot)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.klawtax.online;

    # SSL (managed by certbot)
    ssl_certificate     /etc/letsencrypt/live/api.klawtax.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.klawtax.online/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Proxy to Node.js
    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        # Upload size (document uploads: max 20MB)
        client_max_body_size 20M;
    }
}
```

### Frontend (static files)

```bash
sudo nano /etc/nginx/sites-available/klawtax-frontend
```

```nginx
# /etc/nginx/sites-available/klawtax-frontend
server {
    listen 80;
    server_name klawtax.online www.klawtax.online;
    return 301 https://klawtax.online$request_uri;
}

server {
    listen 443 ssl http2;
    server_name klawtax.online www.klawtax.online;

    ssl_certificate     /etc/letsencrypt/live/klawtax.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/klawtax.online/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/klawtax/frontend/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — all routes return index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/klawtax-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/klawtax-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL Certificates

```bash
# Issue certificates (follow prompts)
sudo certbot --nginx -d klawtax.online -d www.klawtax.online
sudo certbot --nginx -d api.klawtax.online

# Verify auto-renewal
sudo certbot renew --dry-run
```

Certbot adds a cron job automatically. Certificates renew every 90 days.

---

## 8. MongoDB Atlas Setup

1. Create account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create **M10 cluster** (minimum for production; M0 free tier is fine for testing)
3. **Database user:** Create with `readWrite` on `klawtax_prod` database only
4. **Network access:** Add your VPS IP to the IP allowlist
5. **Get connection string:** Cluster → Connect → Drivers → Node.js
6. Paste into `MONGODB_URI` in `.env`
7. Enable **Atlas Backup** (Continuous Backup recommended)

---

## 9. Razorpay Webhook Configuration

1. Log in to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to: **Settings → Webhooks → Add New Webhook**
3. **Webhook URL:** `https://api.klawtax.online/api/v1/webhooks/razorpay`
4. **Events to subscribe:**
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`
5. Copy the generated **webhook secret** and set `RAZORPAY_WEBHOOK_SECRET` in `.env`
6. Reload PM2: `pm2 reload klawtax-api --update-env`
7. Test from Razorpay dashboard → send a test event → check `GET /api/v1/admin/webhooks`

---

## 10. AWS S3 Setup

1. Create an S3 bucket (e.g. `klawtax-prod-documents`) in `ap-south-1`
2. **Enable versioning** on the bucket
3. **Block all public access** — files accessed via pre-signed URLs only
4. Create an **IAM user** with this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
       "Resource": ["arn:aws:s3:::klawtax-prod-documents", "arn:aws:s3:::klawtax-prod-documents/*"]
     }]
   }
   ```
5. Generate access keys for the IAM user and set in `.env`

---

## 11. Health Verification

After deployment, verify:

```bash
# API health
curl https://api.klawtax.online/api/v1/health
# Expected: {"status":"ok","checks":{"database":"ok","redis":"ok","storage":"ok"}}

# Readiness probe
curl https://api.klawtax.online/api/v1/health/ready
# Expected: 200 OK (503 if DB is down)

# Services catalog
curl https://api.klawtax.online/api/v1/services | python3 -m json.tool | head -30

# Frontend
curl -I https://klawtax.online
# Expected: HTTP/2 200
```

---

## 12. Common Operational Commands

```bash
# PM2 process management
pm2 status                          # view all processes
pm2 logs klawtax-api                # tail logs
pm2 logs klawtax-api --lines 100    # last 100 lines
pm2 reload klawtax-api --update-env # reload with new .env values
pm2 restart klawtax-api             # hard restart
pm2 stop klawtax-api                # stop process
pm2 monit                           # real-time CPU/memory dashboard

# Nginx
sudo nginx -t                       # test config syntax
sudo systemctl reload nginx         # apply config changes
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/klawtax/api-out.log
tail -f /var/log/klawtax/api-error.log

# Deploy update
cd /var/www/klawtax
git pull origin main
cd backend && npm ci --omit=dev && npm run build
pm2 reload klawtax-api --update-env
cd ../frontend && npm ci && npm run build
```

---

## 13. Rollback Procedure

If a deployment breaks production:

```bash
# 1. Revert code
cd /var/www/klawtax
git log --oneline -5          # find the last good commit
git checkout <commit-hash>    # check out previous version
cd backend && npm ci --omit=dev && npm run build
pm2 reload klawtax-api

# 2. Verify
curl https://api.klawtax.online/api/v1/health/ready

# 3. After fix, return to main
git checkout main
```

---

*KlawTax Deployment Guide v1.5 — Phase 7.2*

---

## 14. Automated Deployment Scripts (Phase 7.3)

Two scripts are provided in the `scripts/` directory for deployment automation.

### Pre-Deployment Validator

```bash
# Validate environment before deploying (read-only, no changes)
./scripts/deploy-validate.sh

# Validate AND deploy (zero-downtime PM2 reload)
./scripts/deploy-validate.sh --deploy

# First-time deploy (includes database seeding)
./scripts/deploy-validate.sh --fresh

# Roll back to a specific commit
./scripts/deploy-validate.sh --rollback <git-commit-hash>
```

The validator checks:
- Node.js version (≥20 required)
- PM2 installed
- `.env` file present and populated
- All required environment variables set
- `dist/server.js` exists (build complete)
- PM2 process state
- Local API reachability and DB/cache connectivity

### Smoke Test Script

```bash
# Test local API (default)
./scripts/smoke-test.sh

# Test production API
./scripts/smoke-test.sh https://api.klawtax.online

# Via env var
API_URL=https://api.klawtax.online ./scripts/smoke-test.sh
```

The smoke test performs **35+ automated checks** covering:
- Health endpoints (liveness, readiness, main health)
- Public API (services catalog, featured package, contact form)
- Authentication (invalid login, protected routes, token refresh)
- RBAC enforcement (admin routes without token → 401)
- Webhook endpoint (returns 200 for all inputs — spec requirement)
- Rate limiting (429 triggered after threshold)
- Security headers (Helmet, X-Request-ID, no X-Powered-By)
- Error handling (404 returns structured JSON)

Exit code 0 = all tests passed. Exit code 1 = failures detected.

---

## 15. Production Nginx Configuration (Phase 7.3)

A production-hardened Nginx configuration is provided in `nginx/klawtax-nginx.conf`.

Key features:
- HTTP → HTTPS redirect for all domains
- `www.klawtax.online` → `klawtax.online` canonical redirect
- HSTS header with preload
- `proxy_request_buffering off` for webhook and upload endpoints
- `client_max_body_size 25M` for document uploads
- `proxy_read_timeout 120s` for export generation
- Gzip compression for static assets
- Immutable cache headers for hashed static files
- SPA fallback (`try_files $uri $uri/ /index.html`)
- Health endpoints served without rate-limiting or access logging

Copy the relevant server blocks to:
- `/etc/nginx/sites-available/klawtax-api`
- `/etc/nginx/sites-available/klawtax-frontend`

Then run `sudo nginx -t && sudo systemctl reload nginx`.

---

*KlawTax Deployment Guide v1.5 — Updated Phase 7.3*
