
import * as http from 'http';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.SEARCH_SERVER_PORT || 8082;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/search') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { query } = JSON.parse(body);
                console.log(`Received search query: ${query}`);
                
                // Mock response
                const results = [
                    { title: `Result for "${query}" 1`, url: 'https://google.com/search?q=1', snippet: 'This is the first mock result from the gsearch-serv.' },
                    { title: `Result for "${query}" 2`, url: 'https://google.com/search?q=2', snippet: 'This is the second mock result from the gsearch-serv.' },
                ];

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ results }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Google Search mock server listening on http://localhost:${PORT}`);
});
