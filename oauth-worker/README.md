# Zero-Cost GitHub OAuth Worker for CNCF Peshawar CMS

This lightweight Cloudflare Worker enables one-click "Log in with GitHub" for non-technical organizers accessing the website CMS at `/admin`.

## 100% Free Hosting
- Cloudflare Workers Free Tier includes **100,000 requests/day**, no credit card required.

## Setup Instructions (2 Minutes)

1. **Create a GitHub OAuth App**:
   - Go to GitHub -> **Settings** -> **Developer settings** -> **OAuth Apps** -> **New OAuth App**.
   - **Application name**: `CNCF Peshawar CMS`
   - **Homepage URL**: `https://<username>.github.io/cncf-peshawar-website/`
   - **Authorization callback URL**: `https://<your-worker-subdomain>.workers.dev/callback`
   - Click **Register application** and generate a Client Secret.

2. **Deploy the Worker**:
   ```bash
   cd oauth-worker
   npx wrangler login
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   npx wrangler deploy
   ```

3. **Link to CMS**:
   - Update `base_url` in `public/admin/config.yml`:
     ```yaml
     backend:
       name: github
       repo: Cloud-Native-Peshawar/cncf-peshawar-website
       branch: main
       base_url: https://cncf-peshawar-oauth-worker.<your-subdomain>.workers.dev
       auth_endpoint: /auth
     ```
