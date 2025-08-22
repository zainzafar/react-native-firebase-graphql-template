import type { Express, Request, Response } from 'express';
import path from 'node:path';

export function initRoutes(app: Express): void {
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Serve static assets
  const publicDir = path.join(__dirname, '..', 'public');
  app.use('/', require('express').static(publicDir, { fallthrough: true }));

  // Config injector
  app.get('/config.js', (_req: Request, res: Response) => {
    const configRaw = process.env.FIREBASE_WEB_CONFIG || '';
    let config: any = null;
    try { config = configRaw ? JSON.parse(configRaw) : null; } catch {}
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('content-type', 'application/javascript; charset=utf-8');
    res.send(`window.FIREBASE_CONFIG = ${JSON.stringify(config)};`);
  });
}


