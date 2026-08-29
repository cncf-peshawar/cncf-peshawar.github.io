/**
 * Cloudflare Worker: 100% Free Zero-Cost GitHub OAuth proxy for Decap / Sveltia CMS.
 *
 * Environment variables required in Cloudflare Worker settings (or .dev.vars):
 * - GITHUB_CLIENT_ID
 * - GITHUB_CLIENT_SECRET
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Route: /auth - Redirects user to GitHub OAuth
    if (url.pathname === '/auth') {
      const scope = url.searchParams.get('scope') || 'repo,user';
      const state = crypto.randomUUID();

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scope)}&state=${state}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // Route: /callback - Exchanges code for GitHub Access Token & returns message to CMS window
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');

      if (!code) {
        return new Response('Missing authorization code', { status: 400 });
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'CNCF-Peshawar-OAuth-Worker',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return new Response(JSON.stringify(tokenData), { status: 400 });
      }

      // Format response for Netlify / Decap / Sveltia CMS window message listener
      const content = `
        <!doctype html>
        <html>
          <body>
            <script>
              (function() {
                function receiveMessage(e) {
                  window.opener.postMessage(
                    'authorization:github:success:${JSON.stringify({
                      token: tokenData.access_token,
                      provider: 'github',
                    })}',
                    e.origin
                  );
                  window.close();
                }
                window.addEventListener("message", receiveMessage, false);
                window.opener.postMessage("authorizing:github", "*");
              })();
            </script>
          </body>
        </html>
      `;

      return new Response(content, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('CNCF Peshawar OAuth Proxy Worker is online.', { status: 200 });
  },
};
