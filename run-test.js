const http = require('http');
const fs = require('fs');
const path = require('path');

// シンプルなHTTPサーバー
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

const port = 8083;
server.listen(port, () => {
    console.log(`Test server running on http://localhost:${port}`);
    console.log('test.html is available at: http://localhost:${port}/test.html');
    
    // テストページにアクセスしてHTMLを取得
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
                console.log('✓ Test page loaded successfully');
                console.log('Server is running. To test manually, open: http://localhost:8083/test.html');
                // サーバーは手動停止のため継続実行
            });
        });
        
        req.on('error', (error) => {
            console.error('Error:', error);
            server.close();
        });
        
        req.end();
    }, 500);
});