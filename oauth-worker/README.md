# GitHub Authentication for CNCF Peshawar CMS

The CMS portal (`/admin`) supports two authentication methods:

---

## Method 1: Instant Sign-in via GitHub Personal Access Token (Recommended — 0 Setup)

You do **NOT** need to deploy any servers or configure Cloudflare to use the CMS immediately.

1. Go to GitHub -> [Personal Access Tokens (Classic)](https://github.com/settings/tokens) or [Fine-grained Tokens](https://github.com/settings/tokens?type=beta).
2. Click **Generate new token (classic)**:
   - Note: `CNCF Peshawar CMS`
   - Expiration: Choose duration (e.g. 90 days or No expiration)
   - Scope: Check **`repo`** (Full control of private repositories & commits)
3. Copy the generated token (`ghp_...`).
4. Open `/admin` in your browser.
5. In the sign-in modal, switch to the **Personal Access Token** tab, paste your token, and click **Sign In**.

---

## Method 2: One-Click "Log in with GitHub" OAuth Proxy (Optional)

If you want a 1-click OAuth login button for non-technical team members, deploy this Cloudflare Worker (100% free forever on Cloudflare's free tier):

### Setup Instructions (2 Minutes)

1. **Create a GitHub OAuth App**:
   - Go to GitHub -> **Settings** -> **Developer settings** -> **OAuth Apps** -> **New OAuth App**.
   - **Application name**: `CNCF Peshawar CMS`
   - **Homepage URL**: `https://cncf-peshawar.github.io/` (or your custom domain)
   - **Authorization callback URL**: `https://<your-worker-subdomain>.workers.dev/callback`
   - Click **Register application** and copy the **Client ID** and generate a **Client Secret**.

2. **Deploy the Worker to Cloudflare**:
   ```bash
   cd oauth-worker
   npx wrangler login
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy
   ```

3. **Connect to CMS**:
   - In `public/admin/config.yml` (and `public/config.yml`), uncomment and set:
     ```yaml
     backend:
       name: github
       repo: cncf-peshawar/cncf-peshawar.github.io
       branch: main
       base_url: https://cncf-peshawar-oauth-worker.<your-subdomain>.workers.dev
       auth_endpoint: /auth
     ```

