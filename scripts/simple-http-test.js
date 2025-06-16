/**
 * シンプルなHTTPベースのテスト確認
 * ブラウザアクセスをシミュレートしてHTMLコンテンツを確認
 */

const http = require('http');

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function checkTestPage() {
    console.log('🔍 test.htmlの基本チェック実行中...');
    
    try {
        // 1. test.htmlの取得
        const testHtml = await httpGet('http://localhost:8080/tests/test.html');
        
        // 2. 必須スクリプトの読み込み確認
        const requiredScripts = [
            'level-loader.js',
            'config.js', 
            'game.js',
            'test.js'
        ];
        
        console.log('\n📜 スクリプト読み込み確認:');
        const scriptChecks = {};
        for (const script of requiredScripts) {
            const included = testHtml.includes(script);
            scriptChecks[script] = included;
            console.log(`  ${script}: ${included ? '✅' : '❌'}`);
        }
        
        // 3. 重要な要素の存在確認
        console.log('\n🔍 HTML要素確認:');
        const elementChecks = {
            gameCanvas: testHtml.includes('id="gameCanvas"'),
            testResults: testHtml.includes('id="testResults"'),
            corsWarning: testHtml.includes('DISABLE_CORS_WARNING')
        };
        
        for (const [element, exists] of Object.entries(elementChecks)) {
            console.log(`  ${element}: ${exists ? '✅' : '❌'}`);
        }
        
        // 4. 個別スクリプトファイルの確認
        console.log('\n📄 個別スクリプトファイル確認:');
        const scriptFiles = [
            'src/config.js',
            'src/level-loader.js',
            'src/game.js',
            'tests/test.js'
        ];
        
        const fileChecks = {};
        for (const file of scriptFiles) {
            try {
                const content = await httpGet(`http://localhost:8080/${file}`);
                const hasContent = content.length > 100;
                fileChecks[file] = hasContent;
                console.log(`  ${file}: ${hasContent ? '✅' : '❌ (内容不足)'}`);
            } catch (error) {
                fileChecks[file] = false;
                console.log(`  ${file}: ❌ (${error.message})`);
            }
        }
        
        // 5. JSONファイルの確認
        console.log('\n📦 JSONファイル確認:');
        const jsonFiles = ['levels/stages.json', 'levels/stage1.json'];
        const jsonChecks = {};
        
        for (const file of jsonFiles) {
            try {
                const content = await httpGet(`http://localhost:8080/${file}`);
                const parsed = JSON.parse(content);
                jsonChecks[file] = !!parsed;
                console.log(`  ${file}: ✅ (有効なJSON)`);
            } catch (error) {
                jsonChecks[file] = false;
                console.log(`  ${file}: ❌ (${error.message})`);
            }
        }
        
        // 総合判定
        const allScriptsOk = Object.values(scriptChecks).every(Boolean);
        const allElementsOk = Object.values(elementChecks).every(Boolean);
        const allFilesOk = Object.values(fileChecks).every(Boolean);
        const allJsonOk = Object.values(jsonChecks).every(Boolean);
        
        const overallOk = allScriptsOk && allElementsOk && allFilesOk && allJsonOk;
        
        console.log('\n📊 チェック結果サマリー:');
        console.log('=====================================');
        console.log(`スクリプト読み込み: ${allScriptsOk ? '✅' : '❌'}`);
        console.log(`HTML要素: ${allElementsOk ? '✅' : '❌'}`);
        console.log(`スクリプトファイル: ${allFilesOk ? '✅' : '❌'}`);
        console.log(`JSONファイル: ${allJsonOk ? '✅' : '❌'}`);
        console.log('=====================================');
        console.log(`総合判定: ${overallOk ? '✅ 基本構成OK' : '❌ 要修正'}`);
        
        if (overallOk) {
            console.log('\n🎯 次のステップ:');
            console.log('基本構成は正常です。');
            console.log('実際のブラウザテストでJavaScript実行結果を確認してください:');
            console.log('http://localhost:8080/tests/test.html');
        } else {
            console.log('\n⚠️ 問題が検出されました:');
            if (!allScriptsOk) console.log('- スクリプト読み込み設定を確認');
            if (!allElementsOk) console.log('- HTML要素の存在を確認');
            if (!allFilesOk) console.log('- スクリプトファイルの内容を確認');
            if (!allJsonOk) console.log('- JSONファイルの形式を確認');
        }
        
        return {
            success: overallOk,
            details: {
                scripts: scriptChecks,
                elements: elementChecks,
                files: fileChecks,
                json: jsonChecks
            }
        };
        
    } catch (error) {
        console.error('❌ チェック実行エラー:', error.message);
        return { success: false, error: error.message };
    }
}

// 直接実行された場合
if (require.main === module) {
    checkTestPage()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { checkTestPage };