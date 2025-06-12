const http = require('http');
const fs = require('fs');
const path = require('path');

// テストサーバーを起動してブラウザテストの動作を確認
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

const port = 8084;
server.listen(port, () => {
    console.log(`Test server running on http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/test.html in browser to see actual test results`);
    console.log('Press Ctrl+C to stop server');
    
    // test.htmlの内容を確認
    console.log('\n=== Checking test.html content ===');
    
    try {
        const testHtmlContent = fs.readFileSync('test.html', 'utf8');
        console.log('✓ test.html exists and is readable');
        
        // スクリプトタグの確認
        const scriptTags = testHtmlContent.match(/<script[^>]*src="[^"]*"[^>]*>/g);
        if (scriptTags) {
            console.log('\nScript tags found:');
            scriptTags.forEach(tag => {
                const src = tag.match(/src="([^"]*)"/)[1];
                if (fs.existsSync(src)) {
                    console.log(`✓ ${src} - exists`);
                } else {
                    console.log(`✗ ${src} - NOT FOUND`);
                }
            });
        }
        
        // test.jsの最後の部分を確認（DOMContentLoadedイベント）
        const testJsContent = fs.readFileSync('test.js', 'utf8');
        const domContentLoadedMatch = testJsContent.match(/window\.addEventListener\('DOMContentLoaded'[^}]+}\);/);
        if (domContentLoadedMatch) {
            console.log('\n✓ DOMContentLoaded event listener found in test.js');
        } else {
            console.log('\n✗ DOMContentLoaded event listener NOT found in test.js');
        }
        
        // runnerの定義確認
        if (testJsContent.includes('const runner = new TestRunner()')) {
            console.log('✓ Test runner definition found');
        } else {
            console.log('✗ Test runner definition NOT found');
        }
        
    } catch (error) {
        console.error('Error checking files:', error);
    }
});