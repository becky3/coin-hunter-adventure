/**
 * テストページアクセス可能性検証スクリプト
 * 実際のブラウザテストの前提条件を確認
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyTestAccessibility() {
    console.log('🔍 テストページアクセス可能性を検証中...');
    
    const checks = {
        httpServer: false,
        testHtmlExists: false,
        levelLoaderIncluded: false,
        requiredScriptsExists: false,
        stageJsonExists: false
    };
    
    try {
        // 1. HTTPサーバーの動作確認
        console.log('1. HTTPサーバーの動作確認...');
        const serverCheck = await new Promise((resolve) => {
            const req = http.get('http://localhost:8080/', (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
        });
        
        checks.httpServer = serverCheck;
        console.log(`   HTTPサーバー: ${serverCheck ? '✅ 動作中' : '❌ 停止中'}`);
        
        // 2. test.htmlファイルの存在確認
        console.log('2. test.htmlファイルの存在確認...');
        const testHtmlPath = path.join(__dirname, '..', 'tests', 'test.html');
        checks.testHtmlExists = fs.existsSync(testHtmlPath);
        console.log(`   test.html: ${checks.testHtmlExists ? '✅ 存在' : '❌ 未存在'}`);
        
        // 3. test.html内のlevel-loader.js読み込み確認
        if (checks.testHtmlExists) {
            console.log('3. test.html内のスクリプト読み込み確認...');
            const testHtmlContent = fs.readFileSync(testHtmlPath, 'utf8');
            checks.levelLoaderIncluded = testHtmlContent.includes('level-loader.js');
            console.log(`   level-loader.js読み込み: ${checks.levelLoaderIncluded ? '✅ 含まれている' : '❌ 未含有'}`);
        }
        
        // 4. 必要なスクリプトファイルの存在確認
        console.log('4. 必要なスクリプトファイルの存在確認...');
        const requiredScripts = [
            'src/config.js',
            'src/levels.js', 
            'src/level-loader.js',
            'src/game.js',
            'tests/test.js'
        ];
        
        const scriptResults = {};
        for (const script of requiredScripts) {
            const scriptPath = path.join(__dirname, '..', script);
            const exists = fs.existsSync(scriptPath);
            scriptResults[script] = exists;
            console.log(`   ${script}: ${exists ? '✅' : '❌'}`);
        }
        checks.requiredScriptsExists = Object.values(scriptResults).every(Boolean);
        
        // 5. ステージJSONファイルの存在確認
        console.log('5. ステージJSONファイルの存在確認...');
        const stageJsonPath = path.join(__dirname, '..', 'levels', 'stage1.json');
        const stagesJsonPath = path.join(__dirname, '..', 'levels', 'stages.json');
        const stage1Exists = fs.existsSync(stageJsonPath);
        const stagesExists = fs.existsSync(stagesJsonPath);
        checks.stageJsonExists = stage1Exists && stagesExists;
        console.log(`   stage1.json: ${stage1Exists ? '✅' : '❌'}`);
        console.log(`   stages.json: ${stagesExists ? '✅' : '❌'}`);
        
        // 総合判定
        const allChecksPass = Object.values(checks).every(Boolean);
        
        console.log('\n📊 検証結果サマリー:');
        console.log('=====================================');
        console.log(`HTTPサーバー: ${checks.httpServer ? '✅' : '❌'}`);
        console.log(`test.html: ${checks.testHtmlExists ? '✅' : '❌'}`);
        console.log(`level-loader.js読み込み: ${checks.levelLoaderIncluded ? '✅' : '❌'}`);
        console.log(`必要スクリプト: ${checks.requiredScriptsExists ? '✅' : '❌'}`);
        console.log(`ステージJSON: ${checks.stageJsonExists ? '✅' : '❌'}`);
        console.log('=====================================');
        console.log(`総合判定: ${allChecksPass ? '✅ テスト実行可能' : '❌ 要修正'}`);
        
        if (allChecksPass) {
            console.log('\n🎉 全ての前提条件が満たされています');
            console.log('📝 次のステップ: http://localhost:8080/tests/test.html でテストを実行してください');
        } else {
            console.log('\n⚠️  一部の前提条件が満たされていません');
            console.log('🔧 上記の❌項目を修正してからテストを実行してください');
        }
        
        return {
            success: allChecksPass,
            checks: checks,
            details: scriptResults
        };
        
    } catch (error) {
        console.error('❌ 検証中にエラーが発生:', error.message);
        return { success: false, error: error.message };
    }
}

// 直接実行された場合
if (require.main === module) {
    verifyTestAccessibility()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { verifyTestAccessibility };