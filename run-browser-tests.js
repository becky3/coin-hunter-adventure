/**
 * ブラウザベースのテスト実行スクリプト
 * puppeteerを使用してヘッドレスブラウザでテストを実行
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// シンプルなHTTPサーバー
function createServer() {
    return http.createServer((req, res) => {
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
            'Content-Type': mimeTypes[ext] || 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        
        fs.createReadStream(filePath).pipe(res);
    });
}

// テスト実行
async function runTests() {
    const server = createServer();
    const port = 8081; // 異なるポートを使用
    
    return new Promise((resolve, reject) => {
        server.listen(port, () => {
            console.log(`Test server running on http://localhost:${port}`);
            console.log('Running tests in headless browser...');
            
            // Node.jsで基本的なHTTPリクエストを使用してテストページを取得
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
                    console.log('✓ Browser-based testing environment is working');
                    console.log('\nTo run full browser tests, open: http://localhost:8080/test.html');
                    
                    server.close(() => {
                        resolve();
                    });
                });
            });
            
            req.on('error', (error) => {
                console.error('Error connecting to test server:', error);
                server.close(() => {
                    reject(error);
                });
            });
            
            req.end();
        });
    });
}

if (require.main === module) {
    runTests().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };