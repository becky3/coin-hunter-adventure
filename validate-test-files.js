/**
 * test.htmlで読み込まれるファイルの詳細検証
 */

const fs = require('fs');
const path = require('path');

console.log('=== Test File Validation ===\n');

// test.htmlで読み込まれるファイルリスト
const files = ['config.js', 'levels.js', 'music.js', 'game.js', 'test.js'];

files.forEach((filename, index) => {
    console.log(`${index + 1}. Checking ${filename}...`);
    
    try {
        const content = fs.readFileSync(filename, 'utf8');
        console.log(`   ✓ File exists (${content.length} bytes)`);
        
        // JavaScriptシンタックスエラーをチェック
        try {
            // 基本的なシンタックスチェック（eval は危険だが、テスト目的）
            if (filename.endsWith('.js')) {
                // DOM依存のコードを一時的に無効化してシンタックスチェック
                let testContent = content;
                
                // DOM関連を無効化
                testContent = testContent.replace(/document\./g, '({}.');
                testContent = testContent.replace(/window\./g, '({}.');
                testContent = testContent.replace(/canvas\./g, '({}.');
                testContent = testContent.replace(/new Path2D/g, 'new Object');
                testContent = testContent.replace(/new AudioContext/g, 'new Object');
                
                // 関数として実行してシンタックスエラーをキャッチ
                new Function(testContent);
                console.log(`   ✓ JavaScript syntax is valid`);
            }
        } catch (syntaxError) {
            console.log(`   ✗ JavaScript syntax error: ${syntaxError.message}`);
            const lines = content.split('\n');
            const errorLine = syntaxError.lineNumber || 1;
            console.log(`   Around line ${errorLine}: ${lines[errorLine - 1] || 'N/A'}`);
        }
        
        // 特定のパターンをチェック
        if (filename === 'test.js') {
            if (content.includes('const runner = new TestRunner()')) {
                console.log(`   ✓ Test runner declaration found`);
            } else {
                console.log(`   ✗ Test runner declaration NOT found`);
            }
            
            if (content.includes("window.addEventListener('DOMContentLoaded'")) {
                console.log(`   ✓ DOMContentLoaded listener found`);
            } else {
                console.log(`   ✗ DOMContentLoaded listener NOT found`);
            }
            
            if (content.includes('runner.run()')) {
                console.log(`   ✓ Test execution call found`);
            } else {
                console.log(`   ✗ Test execution call NOT found`);
            }
        }
        
        if (filename === 'game.js') {
            if (content.includes('class Game')) {
                console.log(`   ✓ Game class found`);
            }
            if (content.includes('class Player')) {
                console.log(`   ✓ Player class found`);
            }
            if (content.includes('class GameState')) {
                console.log(`   ✓ GameState class found`);
            }
        }
        
        if (filename === 'music.js') {
            if (content.includes('class MusicSystem')) {
                console.log(`   ✓ MusicSystem class found`);
            } else {
                console.log(`   ✗ MusicSystem class NOT found`);
            }
        }
        
    } catch (error) {
        console.log(`   ✗ Error reading file: ${error.message}`);
    }
    
    console.log('');
});

// test.htmlの内容確認
console.log('Checking test.html structure...');
try {
    const testHtml = fs.readFileSync('test.html', 'utf8');
    
    // スクリプトタグの順序確認
    const scriptMatches = [...testHtml.matchAll(/<script src="([^"]+)"/g)];
    console.log('Script loading order:');
    scriptMatches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match[1]}`);
    });
    
    // Canvas要素の確認
    if (testHtml.includes('id="gameCanvas"')) {
        console.log('✓ Canvas element found');
    } else {
        console.log('✗ Canvas element NOT found');
    }
    
    // テスト結果要素の確認
    if (testHtml.includes('id="testResults"')) {
        console.log('✓ Test results container found');
    } else {
        console.log('✗ Test results container NOT found');
    }
    
} catch (error) {
    console.log('✗ Error reading test.html:', error.message);
}

console.log('\n=== File Dependency Check ===');

// 相互依存関係をチェック
try {
    console.log('Testing file loading simulation...');
    
    // グローバル変数の設定をシミュレート
    global.window = { addEventListener: () => {} };
    global.document = { 
        getElementById: () => ({ 
            getContext: () => ({}),
            style: {},
            addEventListener: () => {},
            innerHTML: ''
        }),
        querySelector: () => ({ style: {}, getBoundingClientRect: () => ({}) }),
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
    global.AudioContext = class {};
    global.Path2D = class {};
    global.performance = { now: () => 0 };
    global.requestAnimationFrame = () => {};
    
    // ファイルを順次読み込み
    files.forEach(filename => {
        try {
            let content = fs.readFileSync(filename, 'utf8');
            // DOMContentLoadedを無効化
            content = content.replace(/document\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled');
            content = content.replace(/window\.addEventListener\('DOMContentLoaded'[^}]+}\);/, '// DOMContentLoaded disabled');
            
            eval(content);
            console.log(`✓ ${filename} loaded successfully in simulation`);
        } catch (error) {
            console.log(`✗ ${filename} failed to load: ${error.message}`);
        }
    });
    
    // 重要な変数が定義されているかチェック
    console.log('\nVariable availability check:');
    console.log(`CANVAS_WIDTH: ${typeof CANVAS_WIDTH !== 'undefined' ? '✓' : '✗'}`);
    console.log(`levelData: ${typeof levelData !== 'undefined' ? '✓' : '✗'}`);
    console.log(`MusicSystem: ${typeof MusicSystem !== 'undefined' ? '✓' : '✗'}`);
    console.log(`GameState: ${typeof GameState !== 'undefined' ? '✓' : '✗'}`);
    console.log(`Player: ${typeof Player !== 'undefined' ? '✓' : '✗'}`);
    console.log(`Game: ${typeof Game !== 'undefined' ? '✓' : '✗'}`);
    
} catch (error) {
    console.log('✗ Simulation failed:', error.message);
}