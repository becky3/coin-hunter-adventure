/**
 * cURLベースのテストページ検証
 * ブラウザエンジンに依存しない方法でのテスト結果確認
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class CurlTestValidator {
    async httpGet(url) {
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
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('HTTP request timeout'));
            });
        });
    }
    
    async validateTestPageStructure() {
        console.log('🔍 テストページ構造検証開始...');
        
        try {
            // 1. test.htmlを取得
            const testHtml = await this.httpGet('http://localhost:8080/tests/test.html');
            
            const results = {
                pageLoaded: true,
                scriptsIncluded: {},
                elementsPresent: {},
                issues: []
            };
            
            // 2. 必須スクリプトの確認
            const requiredScripts = [
                'level-loader.js',
                'config.js',
                'game.js',
                'test.js'
            ];
            
            console.log('\n📜 スクリプト読み込み確認:');
            for (const script of requiredScripts) {
                const included = testHtml.includes(`src="../src/${script}"`) || testHtml.includes(`src="../tests/${script}"`) || testHtml.includes(script);
                results.scriptsIncluded[script] = included;
                console.log(`  ${script}: ${included ? '✅' : '❌'}`);
                if (!included) {
                    results.issues.push(`Missing script: ${script}`);
                }
            }
            
            // 3. 重要な要素の確認
            const requiredElements = [
                { name: 'gameCanvas', pattern: 'id="gameCanvas"' },
                { name: 'testResults', pattern: 'id="testResults"' }
            ];
            
            console.log('\n🔍 HTML要素確認:');
            for (const element of requiredElements) {
                const present = testHtml.includes(element.pattern);
                results.elementsPresent[element.name] = present;
                console.log(`  ${element.name}: ${present ? '✅' : '❌'}`);
                if (!present) {
                    results.issues.push(`Missing element: ${element.name}`);
                }
            }
            
            // 4. 個別スクリプトファイルの確認
            console.log('\n📄 個別スクリプトファイル確認:');
            const scriptFiles = [
                'src/config.js',
                'src/level-loader.js', 
                'src/game.js',
                'tests/test.js'
            ];
            
            for (const file of scriptFiles) {
                try {
                    const content = await this.httpGet(`http://localhost:8080/${file}`);
                    const hasContent = content.length > 100;
                    console.log(`  ${file}: ${hasContent ? '✅' : '❌ (内容不足)'}`);
                    if (!hasContent) {
                        results.issues.push(`Script file too small: ${file}`);
                    }
                } catch (error) {
                    console.log(`  ${file}: ❌ (${error.message})`);
                    results.issues.push(`Script file error: ${file} - ${error.message}`);
                }
            }
            
            // 5. JSONファイル確認
            console.log('\n📦 JSONファイル確認:');
            const jsonFiles = ['levels/stages.json', 'levels/stage1.json'];
            
            for (const file of jsonFiles) {
                try {
                    const content = await this.httpGet(`http://localhost:8080/${file}`);
                    const parsed = JSON.parse(content);
                    console.log(`  ${file}: ✅ (有効なJSON)`);
                } catch (error) {
                    console.log(`  ${file}: ❌ (${error.message})`);
                    results.issues.push(`JSON file error: ${file} - ${error.message}`);
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ 検証エラー:', error.message);
            return { error: error.message };
        }
    }
    
    generateTestInstructions(results) {
        console.log('\n📋 手動テスト手順:');
        console.log('=====================================');
        
        if (results.issues && results.issues.length > 0) {
            console.log('⚠️ 検出された問題:');
            results.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue}`);
            });
            console.log('\n🔧 上記問題を修正してからブラウザテストを実行してください。');
        } else {
            console.log('✅ 基本構造は正常です。');
        }
        
        console.log('\n📖 ブラウザテスト手順:');
        console.log('1. ブラウザで http://localhost:8080/tests/test.html を開く');
        console.log('2. ページが読み込まれるまで待機（5-10秒）');
        console.log('3. 以下を確認:');
        console.log('   - 「window.gameが存在しません」エラーが表示されないか');
        console.log('   - テスト結果セクションに成功/失敗の数が表示されるか');
        console.log('   - ブラウザの開発者ツール（F12）でJavaScriptエラーがないか');
        console.log('4. 結果を以下の形式で記録:');
        console.log('   - 成功したテスト数: X件');
        console.log('   - 失敗したテスト数: Y件');
        console.log('   - 主なエラーメッセージ: (あれば)');
        
        console.log('\n💡 トラブルシューティング:');
        console.log('- キャッシュ問題: Ctrl+F5 (強制リロード)');
        console.log('- CORS問題: HTTPサーバーが正常に動作しているか確認');
        console.log('- JavaScript無効: ブラウザのJavaScriptが有効か確認');
    }
}

async function runCurlTestValidation() {
    const validator = new CurlTestValidator();
    
    try {
        console.log('🧪 cURLベーステスト検証開始...');
        
        const results = await validator.validateTestPageStructure();
        
        // 結果の記録
        const testResultsData = {
            timestamp: new Date().toISOString(),
            method: 'curl_validation',
            status: results.error ? 'error' : (results.issues?.length > 0 ? 'issues_found' : 'structure_valid'),
            validation_results: results,
            manual_test_required: true
        };
        
        const testResultsPath = path.join(__dirname, '..', '.test-results.json');
        fs.writeFileSync(testResultsPath, JSON.stringify(testResultsData, null, 2));
        
        // 手動テスト手順の生成
        validator.generateTestInstructions(results);
        
        console.log('\n💾 検証結果を .test-results.json に保存');
        console.log('=====================================');
        
        return results;
        
    } catch (error) {
        console.error('❌ 致命的エラー:', error.message);
        return { error: error.message };
    }
}

// 直接実行された場合
if (require.main === module) {
    runCurlTestValidation()
        .then(result => {
            const success = !result.error && (!result.issues || result.issues.length === 0);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { runCurlTestValidation };