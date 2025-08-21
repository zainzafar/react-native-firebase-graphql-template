import express from 'express';
import http from 'http';
import cors from 'cors';
import { applyApolloMiddleware } from './server/apollo';

const PORT: number = Number(process.env.PORT || 3000);

async function start() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cors());
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  await applyApolloMiddleware({ app, httpServer });

  httpServer.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}/graphql`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
