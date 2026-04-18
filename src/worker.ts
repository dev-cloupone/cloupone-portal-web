interface Env {
  ASSETS: Fetcher;
  RATE_LIMITER: RateLimit;
}

const BLOCKED_TLS = new Set(["TLSv1", "TLSv1.1"]);

const CSP_PRODUCTION = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.cloupone.com.br",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CSP_DEV = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.cloupone.com.br https://dev.portal.cloupone.com.br",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const ASSET_EXTENSION_REGEX =
  /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|map)$/i;

function isDevEnvironment(hostname: string): boolean {
  return hostname.startsWith("dev.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // TLS version enforcement
    const tlsVersion = (request as RequestInit & { cf?: { tlsVersion?: string } }).cf
      ?.tlsVersion;
    if (tlsVersion && BLOCKED_TLS.has(tlsVersion)) {
      return new Response("Please use TLS 1.2 or higher.", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Rate limiting — only for non-asset requests (HTML pages / SPA routes)
    if (!ASSET_EXTENSION_REGEX.test(url.pathname)) {
      const clientIP = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
      if (!success) {
        return new Response("Too many requests", {
          status: 429,
          headers: {
            "Content-Type": "text/plain",
            "Retry-After": "60",
          },
        });
      }
    }

    // Fetch asset from the static assets binding
    const response = await env.ASSETS.fetch(request);
    const newResponse = new Response(response.body, response);

    // Set Content-Security-Policy based on environment
    const csp = isDevEnvironment(url.hostname) ? CSP_DEV : CSP_PRODUCTION;
    newResponse.headers.set("Content-Security-Policy", csp);

    // Set security headers
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      newResponse.headers.set(key, value);
    }

    // Remove server identification headers
    newResponse.headers.delete("X-Powered-By");
    newResponse.headers.delete("Server");

    return newResponse;
  },
} satisfies ExportedHandler<Env>;
