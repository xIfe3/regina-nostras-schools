# Deploying to a Contabo VPS with Dokploy

The website and the API run together in **one container**, built from the
`Dockerfile` in the project root. One deploy updates both.

```
https://reginanostraschools.com
   ├── /          → website (React pages)
   └── /api/...   → API (Express)
```

## Before you start

- A Contabo VPS with Dokploy installed (`curl -sSL https://dokploy.com/install.sh | sh`) and
  its dashboard open on `http://VPS-IP:3000`.
- This repository on GitHub.
- A MongoDB database (see step 2).
- A Cloudflare R2 bucket for uploads (see step 3).

## 1. Point the domain at the VPS

In your DNS (Cloudflare or your registrar), create:

| Type | Name  | Value  |
|------|-------|--------|
| A    | `@`   | VPS IP |
| A    | `www` | VPS IP |

If the domain is on Cloudflare, leave these **DNS only (grey cloud)** until the HTTPS
certificate has been issued in step 5. You can then switch to **Proxied (orange)** and set
Cloudflare SSL/TLS mode to **Full (strict)**.

## 2. Database

Pick one:

- **Keep your current MongoDB Atlas database:** in Atlas, go to Network Access and allow the
  VPS IP. Use the same `MONGODB_URI` as now.
- **Run MongoDB on the VPS:** in Dokploy, open your project, choose Create Service →
  Database → MongoDB, and deploy it. Use its **internal** connection URL as `MONGODB_URI`.
  Turn on scheduled backups in Dokploy. R2 can be the backup destination, because it is
  S3-compatible.

## 3. Cloudflare R2 (uploaded files)

1. Cloudflare dashboard → R2 → **Create bucket** (e.g. `regina-nostra-files`).
2. Bucket → Settings → **Public access**: connect a custom domain such as
   `files.reginanostraschools.com` (or enable the r2.dev URL). This is `R2_PUBLIC_URL`.
3. R2 → **Manage API tokens** → create a token with *Object Read & Write* on that bucket.
   Copy the Access Key ID and Secret Access Key. Your Account ID is shown on the R2 overview page.

## 4. Create the app in Dokploy

1. **Projects → Create Project** (e.g. "Regina Nostra").
2. **Create Service → Application**.
3. **General → Provider:** GitHub. Pick this repository and the branch to deploy
   (normally `main`).
4. **Build Type:** Dockerfile.
   - Docker File: `Dockerfile`
   - Docker Context Path: `.`
5. **Environment:** paste the variables from `backend/.env.example` with real values. You
   need at least:
   `NODE_ENV=production`, `PORT=5000`, `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`,
   the `EMAIL_*` settings (port 465) and all five `R2_*` settings.
6. Click **Deploy** and watch the build log. The first build takes a few minutes.

## 5. Domain and HTTPS

App → **Domains → Add Domain**:

- Host: `reginanostraschools.com`
- Path: `/`
- Container Port: `5000`
- HTTPS: on, Certificate: **Let's Encrypt**

Add a second domain for `www.reginanostraschools.com` the same way. Under Advanced →
Redirects you can send `www` to the main address.

## 6. Create the first admin (new database only)

App → **Docker terminal** (or `docker exec -it <container> sh` on the VPS), then run:

```sh
node dist/utils/seedAdmin.js
```

It uses `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment. Sign in and change the
password straight away. Skip this step if you kept your existing database.

## 7. Check it

- `https://reginanostraschools.com/api/health` should return `{"status":"OK", ...}`.
- Open the site, sign in as admin, and upload a test file (for example a student photo).
  It should appear in your R2 bucket.

## Updating

Push to the deployed branch. With **Auto Deploy** turned on (app → Deployments), Dokploy
rebuilds and restarts automatically; otherwise click **Deploy**. Website and API always go
out together.

If a deploy goes wrong, redeploy the previous one from the app's **Deployments** list.

## Running locally

```sh
# terminal 1: API on http://localhost:5000
cd backend && npm install && npm run dev

# terminal 2: website on http://localhost:3000 (its /api calls are forwarded to port 5000)
cd frontend && npm install && npm run dev
```

To test the production container on your computer:

```sh
docker build -t regina-nostra .
docker run -p 5000:5000 --env-file backend/.env regina-nostra
# open http://localhost:5000
```

## After moving off Vercel

Once the site works on the VPS, delete or pause the Vercel project and the old
`api.reginanostraschools.com` server. `frontend/vercel.json` is then no longer used.
