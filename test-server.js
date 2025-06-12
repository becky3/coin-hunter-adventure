const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// HTTPサーバー
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'test.html' : req.url);
    
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

const port = 8086;
server.listen(port, async () => {
    console.log(`Test server running on http://localhost:${port}`);
    console.log('Testing test.html functionality...');
    
    // test.htmlにHTTPリクエストを送って内容を取得
    setTimeout(() => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/test.html',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('\n=== test.html Response Analysis ===');
                console.log('Status:', res.statusCode);
                console.log('Content-Type:', res.headers['content-type']);
                console.log('Content length:', data.length);
                
                // HTMLの重要な部分をチェック
                if (data.includes('<script src="config.js">')) {
                    console.log('✓ config.js script tag found');
                } else {
                    console.log('✗ config.js script tag NOT found');
                }
                
                if (data.includes('<script src="test.js">')) {
                    console.log('✓ test.js script tag found');
                } else {
                    console.log('✗ test.js script tag NOT found');
                }
                
                if (data.includes('id="gameCanvas"')) {
                    console.log('✓ Canvas element found');
                } else {
                    console.log('✗ Canvas element NOT found');
                }
                
                console.log('\nOpen http://localhost:8086/test.html in browser to see actual test results');
                console.log('Press Ctrl+C to stop server');
                
                // サーバーを継続実行
            });
        });
        
        req.on('error', (error) => {
            console.error('Error testing test.html:', error);
            server.close();
        });
        
        req.end();
    }, 500);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        process.exit(0);
    });
});