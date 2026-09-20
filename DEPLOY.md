# Deploying behind Cloudflare

The app is a standard Node.js Next.js server with a SQLite database file (`data/store.db`), so it needs a host with a **persistent disk**. Cloudflare then sits in front for DNS, SSL, CDN, WAF and bot protection.

## 1. Choose a host for the Node app
Any of these work (all support persistent volumes):
- **VPS** (Hetzner / DigitalOcean / Lightsail, ~$5/mo): `git clone`, `npm ci`, `npm run build`, run with PM2 or the Dockerfile below.
- **Railway / Render / Fly.io**: deploy from Git, attach a volume mounted at `/app/data`.

Environment variables:
```
AUTH_SECRET=<64 random chars>        # openssl rand -hex 32
SITE_URL=https://yourstore.com
DATABASE_URL=/app/data/store.db      # on the persistent volume
ADMIN_EMAIL=you@yourstore.com
ADMIN_PASSWORD=<strong password>     # used only on first seed
```
First boot: `npm run db:seed` (or run it once from a shell in the container).

### Dockerfile
```Dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npm","start"]
```

## 2. Put Cloudflare in front
1. Add your domain in the Cloudflare dashboard and switch nameservers at your registrar.
2. **DNS** → `A` (or `CNAME`) record `@` → your server IP/host, proxy status **Proxied** (orange cloud). Add `www` as CNAME to `@`.
3. **SSL/TLS** → mode **Full (strict)**; enable *Always use HTTPS* and *Automatic HTTPS Rewrites*. Your origin needs a cert — Caddy/Nginx + Let's Encrypt, or a Cloudflare Origin Certificate.
4. **Speed → Optimization**: enable Brotli, Early Hints. **Caching**: default; static assets under `/_next/static` are immutable and cached automatically.
5. **Security**: enable Bot Fight Mode; add a WAF rate-limit rule for `/api/*` and `/login` (e.g. 30 req/min per IP).
6. Cache purge from the admin: create an API token (*Zone → Cache Purge*, *Zone → Zone Read*) and paste it with the Zone ID in **Admin → Plugins → Cloudflare Hosting**.

## 3. Media on Cloudflare R2
1. R2 → *Create bucket* (e.g. `store-media`).
2. Bucket → Settings → **Public access** → connect custom domain `cdn.yourstore.com` (or enable r2.dev).
3. *Manage R2 API tokens* → create token with **Object Read & Write** scoped to the bucket.
4. Admin → Plugins → **Cloudflare R2**: paste Account ID, Access Key, Secret, bucket, public URL → *Test connection* → enable.

## 4. Payments & email
- **Razorpay**: Settings → API Keys; Settings → Webhooks → `https://yourstore.com/api/webhooks/razorpay` (events `payment.captured`, `payment.failed`) with the same secret you enter in the plugin.
- **Cashfree**: Developers → API keys; Webhooks → `https://yourstore.com/api/webhooks/cashfree`.
- **SMTP**: Gmail app password (host `smtp.gmail.com`, port 587) or a transactional provider (Resend/Brevo/SES) with SPF + DKIM configured on your domain. Use *Send test email* to verify.

## Backups
`data/store.db` is the whole store. Back it up daily, e.g. `sqlite3 data/store.db ".backup backup-$(date +%F).db"` and push to R2 with `rclone`.

## Optional: Cloudflare Workers/Pages
Running on Cloudflare's edge requires swapping SQLite for **D1** (drizzle supports it) and local uploads for R2-only. The data layer is isolated in `src/lib/db`, so this is a contained change, but it is not part of the default setup.
