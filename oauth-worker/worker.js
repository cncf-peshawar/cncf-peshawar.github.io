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

    // Single strict production origin for CNCF Peshawar Website CMS
    const ALLOWED_ORIGIN = 'https://cncf-peshawar.github.io';
    const originHeader = request.headers.get('Origin');
    const isAllowed = originHeader === ALLOWED_ORIGIN;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowed) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Route: /auth or /oauth - Redirects user to GitHub OAuth
    if (url.pathname === '/auth' || url.pathname === '/oauth' || url.pathname === '/oauth/authorize') {
      const scope = url.searchParams.get('scope') || 'repo,user';
      const state = crypto.randomUUID();

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=${encodeURIComponent(scope)}&state=${state}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // Route: /callback or /oauth/callback - Exchanges code for GitHub Access Token & returns message to CMS window
    if (url.pathname === '/callback' || url.pathname === '/oauth/callback') {
      // Handle user cancellation or GitHub OAuth error
      if (url.searchParams.get('error')) {
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description') || error;
        const errorContent = `
          <!doctype html>
          <html>
            <body>
              <script>
                (function() {
                  if (window.opener) {
                    window.opener.postMessage('authorization:github:error:${JSON.stringify({ error: errorDescription })}', '${ALLOWED_ORIGIN}');
                    window.close();
                  }
                })();
              </script>
              <p style="font-family: sans-serif; text-align: center; padding: 40px;">
                Authentication canceled: ${errorDescription}. You may close this window.
              </p>
            </body>
          </html>
        `;
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

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
        const errorContent = `
          <!doctype html>
          <html>
            <body>
              <script>
                (function() {
                  if (window.opener) {
                    window.opener.postMessage('authorization:github:error:${JSON.stringify(tokenData)}', '${ALLOWED_ORIGIN}');
                    window.close();
                  }
                })();
              </script>
              <p style="font-family: sans-serif; text-align: center; padding: 40px;">
                OAuth Error: ${tokenData.error_description || tokenData.error}. You may close this window.
              </p>
            </body>
          </html>
        `;
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: 400,
        });
      }

      // Format response for Netlify / Decap / Sveltia CMS window message listener
      const content = `
        <!doctype html>
        <html>
          <body>
            <script>
              (function() {
                var ALLOWED_ORIGIN = 'https://cncf-peshawar.github.io';
                function receiveMessage(e) {
                  if (e.origin !== ALLOWED_ORIGIN) {
                    console.warn('Blocked unauthorized OAuth origin:', e.origin);
                    return;
                  }
                  window.opener.postMessage(
                    'authorization:github:success:${JSON.stringify({
                      token: tokenData.access_token,
                      provider: 'github',
                    })}',
                    ALLOWED_ORIGIN
                  );
                  window.close();
                }
                window.addEventListener("message", receiveMessage, false);
                window.opener.postMessage("authorizing:github", ALLOWED_ORIGIN);
              })();
            </script>
            <p style="font-family: sans-serif; text-align: center; padding: 40px;">
              Authentication successful. Redirecting back to CMS...
            </p>
          </body>
        </html>
      `;

      return new Response(content, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': isAllowed ? ALLOWED_ORIGIN : 'null',
        },
      });
    }

    return new Response('CNCF Peshawar OAuth Proxy Worker is online.', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? ALLOWED_ORIGIN : 'null',
        'Content-Type': 'text/plain',
      },
    });
  },
};
