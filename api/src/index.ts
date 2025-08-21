import { createServer } from 'node:http';

const PORT: number = Number(process.env.PORT || 3000);

const server = createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify({ ok: true, message: 'API server is running' }));
});

server.listen(PORT, () => {
	console.log(`API server listening on http://localhost:${PORT}`);
});
