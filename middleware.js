/**
 * Vercel Edge Middleware — IP-based maintenance mode.
 *
 * Blocks all requests except from ALLOWED_IPS.
 * Set MAINTENANCE_MODE=true and MAINTENANCE_ALLOWED_IPS=1.2.3.4,5.6.7.8
 * in Vercel Dashboard → Settings → Environment Variables.
 *
 * To disable: set MAINTENANCE_MODE=false (or remove it) and redeploy.
 */

export const config = {
  // Apply to all routes except Vercel internals and static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};

export default function middleware(request) {
  const maintenanceMode = process.env.MAINTENANCE_MODE || 'false';

  // If maintenance mode is off, allow everything
  if (!['true', '1', 'yes'].includes(maintenanceMode.toLowerCase())) {
    return; // pass through
  }

  const allowedRaw = process.env.MAINTENANCE_ALLOWED_IPS || '';
  const allowedIps = new Set(
    allowedRaw.split(',').map((ip) => ip.trim()).filter(Boolean)
  );

  // Get client IP from Vercel's headers
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';

  if (allowedIps.has(clientIp)) {
    return; // allowed — pass through
  }

  // Block with a maintenance page
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maintenance | Astro Yagya</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0a23 0%, #1a1a3e 50%, #0d0d2b 100%);
      color: #e0d4c8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 2rem;
    }
    .container { max-width: 500px; }
    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.8rem; margin-bottom: 1rem; color: #f5c542; }
    p { font-size: 1.1rem; line-height: 1.6; opacity: 0.85; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#128295;</div>
    <h1>Under Maintenance</h1>
    <p>Astro Yagya is undergoing scheduled maintenance.<br>We'll be back shortly!</p>
  </div>
</body>
</html>`,
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '3600',
      },
    }
  );
}
