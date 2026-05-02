import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class LandingController {
  @Get('/')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getLandingPage() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Birdsfly API</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; }
      .wrap { max-width: 880px; margin: 0 auto; padding: 48px 20px; }
      .card { border: 1px solid rgba(127,127,127,.25); border-radius: 14px; padding: 20px; }
      code { padding: 2px 6px; border-radius: 8px; background: rgba(127,127,127,.12); }
      a { color: inherit; }
      .muted { opacity: .75; }
      ul { margin: 10px 0 0 18px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Birdsfly API</h1>
      <p class="muted">Backend service is running.</p>

      <div class="card">
        <p>Useful endpoints:</p>
        <ul>
          <li><code>/api/health</code></li>
          <li><code>/api</code> (API prefix)</li>
        </ul>
      </div>
    </div>
  </body>
</html>`;
  }
}
