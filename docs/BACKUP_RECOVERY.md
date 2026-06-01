# KlawTax — Backup & Recovery Guide
## Version 1.5 | Phase 7.2

---

## 1. MongoDB Atlas — Database Backup

### Continuous Backup (Recommended)

MongoDB Atlas M10+ clusters support **Continuous Backup** (point-in-time recovery).

**Enable in Atlas:**
1. Cluster → Backup tab → Enable Cloud Backups
2. Set backup policy: Daily snapshots retained 7 days; Weekly retained 4 weeks

**Restore from Atlas backup:**
1. Atlas → Cluster → Backup → Snapshots
2. Select snapshot → Restore → Restore to new cluster (recommended — don't overwrite production)
3. After verifying data, update `MONGODB_URI` in `.env` to point to restored cluster
4. `pm2 reload klawtax-api --update-env`

**RTO (Recovery Time Objective):** 30–60 minutes
**RPO (Recovery Point Objective):** ≤ 1 hour (continuous backup lag)

### Manual Export (Secondary Backup)

Run weekly from your VPS or Atlas Data Explorer:

```bash
# Install mongodump (mongosh tools)
sudo apt install -y mongodb-database-tools

# Export all collections
mongodump \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/klawtax_prod" \
  --out=/var/backups/klawtax/mongo/$(date +%Y-%m-%d)

# Compress
tar -czf /var/backups/klawtax/mongo-$(date +%Y-%m-%d).tar.gz \
  /var/backups/klawtax/mongo/$(date +%Y-%m-%d)

# Upload to S3 (long-term cold storage)
aws s3 cp /var/backups/klawtax/mongo-$(date +%Y-%m-%d).tar.gz \
  s3://klawtax-prod-backups/mongo/

# Clean up local
rm -rf /var/backups/klawtax/mongo/$(date +%Y-%m-%d)
```

**Cron job (add via `crontab -e`):**
```cron
# Weekly MongoDB export every Sunday at 2:00 AM
0 2 * * 0 /var/www/klawtax/scripts/backup-mongo.sh >> /var/log/klawtax/backup.log 2>&1
```

**Restore from mongodump:**
```bash
mongorestore \
  --uri="mongodb+srv://user:pass@cluster.mongodb.net/klawtax_prod" \
  --drop \
  /var/backups/klawtax/mongo/2025-01-15/klawtax_prod/
```

---

## 2. AWS S3 — File Storage Backup

Uploaded documents are stored in S3. Enable:

**Versioning** (must be on for production):
```bash
aws s3api put-bucket-versioning \
  --bucket klawtax-prod-documents \
  --versioning-configuration Status=Enabled
```

**Cross-region replication (optional but recommended):**
- S3 → Management → Replication rules
- Replicate to `klawtax-prod-documents-backup` in a different region

**Object Lock / retention (for legal documents):**
```bash
# Enable Object Lock (immutable for 90 days)
aws s3api put-bucket-object-lock-configuration \
  --bucket klawtax-prod-documents \
  --object-lock-configuration '{"ObjectLockEnabled":"Enabled","Rule":{"DefaultRetention":{"Mode":"GOVERNANCE","Days":90}}}'
```

---

## 3. Redis — Cache Persistence

Redis (via Upstash) stores:
- Dashboard aggregation caches (5-minute TTL)
- Notification unread counts
- System settings cache

**Redis is a cache, not a source of truth.** If Redis is lost, it is auto-repopulated from MongoDB on next request. No backup needed for Redis data.

**Upstash persistence:** Upstash automatically persists data to disk every second (AOF). No additional configuration needed.

---

## 4. Environment Files Backup

`.env` files contain secrets and must be backed up securely (NOT in git).

**Recommended approach:**

```bash
# Encrypt and store in your password manager (e.g., 1Password, Bitwarden)
# Or use AWS Secrets Manager for team access

# Minimal offline backup:
gpg --symmetric --cipher-algo AES256 /var/www/klawtax/backend/.env
# Store the encrypted file in a secure location
```

---

## 5. Disaster Recovery Runbook

### Scenario: VPS destroyed or unrecoverable

**Expected recovery time: 2–4 hours**

1. Provision a new Ubuntu 22.04 VPS
2. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) — Server Initial Setup through PM2 sections
3. Restore MongoDB: point `MONGODB_URI` to existing Atlas cluster (data is safe in Atlas)
4. Restore `.env` from your secure backup
5. S3 files are safe in AWS — just update `.env` with credentials
6. `npm run build && pm2 start ecosystem.config.js --env production`
7. Restore Nginx config (keep a copy in your repo or in `/var/backups/klawtax/nginx/`)
8. Verify: `curl https://api.klawtax.online/api/v1/health/ready`

### Scenario: Database corruption or accidental deletion

1. Immediately stop writes: `pm2 stop klawtax-api`
2. Go to Atlas → Backup → select a point-in-time before the incident
3. Restore to a new cluster (e.g. `klawtax-prod-restored`)
4. Verify data integrity on the new cluster
5. Update `MONGODB_URI` in `.env` to point to restored cluster
6. `pm2 start klawtax-api --update-env`
7. Switch DNS or update load balancer when ready

### Scenario: Deployment broke production

See rollback procedure in [DEPLOYMENT.md](./DEPLOYMENT.md#13-rollback-procedure).

---

## 6. Backup Verification Drill (Monthly)

Run on the first Sunday of each month:

```bash
#!/bin/bash
# /var/www/klawtax/scripts/backup-verify.sh

echo "=== KlawTax Backup Verification $(date) ==="

# 1. Restore latest Atlas snapshot to a staging cluster
# (done manually via Atlas UI — verify in Atlas dashboard)
echo "[ ] Atlas snapshot verified in dashboard"

# 2. Connect staging app to restored cluster and run smoke tests
echo "[ ] Staging smoke tests against restored cluster"

# 3. Verify S3 objects
BUCKET_COUNT=$(aws s3 ls s3://klawtax-prod-documents --recursive | wc -l)
echo "[✓] S3 document count: $BUCKET_COUNT"

# 4. Confirm versioning is on
VERSIONING=$(aws s3api get-bucket-versioning --bucket klawtax-prod-documents | python3 -c "import sys,json; print(json.load(sys.stdin).get('Status','DISABLED'))")
echo "[✓] S3 versioning: $VERSIONING"

echo "=== Drill complete — log results in backup-verification-log ==="
```

---

*KlawTax Backup & Recovery Guide v1.5 — Phase 7.2*
