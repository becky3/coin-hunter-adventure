const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'test-debug.html' : req.url);
    
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
    }
    
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css'
    };
    
    res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'text/plain'
    });
    
    fs.createReadStream(filePath).pipe(res);
});

const port = 8085;
server.listen(port, () => {
    console.log(`Debug test server running on http://localhost:${port}`);
    console.log('The debug page will show detailed console output');
    console.log('Press Ctrl+C to stop server');
});

// Keep server running
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        process.exit(0);
    });
});