const puppeteer = require('puppeteer');

async function checkTestHtml() {
    let browser = null;
    
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        const logs = [];
        page.on('console', msg => {
            const text = msg.text();
            logs.push(text);
        });
        
        page.on('pageerror', error => {
            logs.push(`PAGE ERROR: ${error.message}`);
        });
        
        await page.goto('http://localhost:8080/tests/test.html', {
            waitUntil: 'networkidle0',
            timeout: 15000
        });
        
        await page.waitForTimeout(2000);
        
        const status = await page.evaluate(() => {
            return {
                gameExists: typeof window.game !== 'undefined' && window.game !== null,
                gameInitError: window.gameInitError ? window.gameInitError.message : null,
                levelLoaderExists: typeof LevelLoader !== 'undefined'
            };
        });
        
        const failedTests = await page.evaluate(() => {
            const failedElements = document.querySelectorAll('.test-fail');
            return Array.from(failedElements).map(el => el.textContent.trim());
        });
        
        return { status, failedTests, logs };
        
    } finally {
        if (browser) await browser.close();
    }
}

checkTestHtml().then(result => {
    console.log('Status:', result.status);
    console.log('Failed tests:', result.failedTests);
    console.log('Errors:', result.logs.filter(log => log.includes('エラー') || log.includes('ERROR')));
}).catch(console.error);