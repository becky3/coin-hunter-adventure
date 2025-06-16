/**
 * 実際のブラウザエラーを模擬確認
 */
const fs = require('fs');
const path = require('path');

// Node.js環境でfetchをモック
global.fetch = async (url) => {
    const filePath = path.join(__dirname, url);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return {
            ok: true,
            status: 200,
            json: () => Promise.resolve(JSON.parse(content))
        };
    } catch (error) {
        return {
            ok: false,
            status: 404
        };
    }
};

// DOM要素のモック（最小限）
global.document = {
    getElementById: (id) => ({
        getContext: () => ({
            fillStyle: '',
            fillRect: () => {},
            fillText: () => {},
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            drawImage: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            setTransform: () => {},
            measureText: () => ({width: 0}),
            canvas: {width: 1024, height: 576}
        }),
        style: {},
        textContent: '',
        addEventListener: () => {},
        width: 1024,
        height: 576
    }),
    addEventListener: () => {},
    createElement: () => ({
        textContent: '',
        style: {},
        appendChild: () => {}
    }),
    querySelectorAll: () => [],
    querySelector: () => ({
        style: {},
        getBoundingClientRect: () => ({width: 1024, height: 576})
    }),
    head: {
        appendChild: () => {}
    },
    body: {
        appendChild: () => {}
    }
};

global.window = {
    location: {
        protocol: 'http:',
        href: 'http://localhost:8080/'
    },
    addEventListener: () => {},
    fetch: global.fetch
};

global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = String(value); },
    removeItem: function(key) { delete this.data[key]; },
    clear: function() { this.data = {}; }
};

// console用のログ収集
const logs = [];
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
};

console.log = (...args) => {
    logs.push({type: 'log', message: args.join(' ')});
    originalConsole.log(...args);
};

console.error = (...args) => {
    logs.push({type: 'error', message: args.join(' ')});
    originalConsole.error(...args);
};

console.warn = (...args) => {
    logs.push({type: 'warn', message: args.join(' ')});
    originalConsole.warn(...args);
};

async function testGameInitialization() {
    try {
        console.log('🔍 実際のゲーム初期化テスト開始');
        
        // スクリプトを順番に読み込み
        const scripts = [
            'src/config.js',
            'src/levels.js', 
            'src/level-loader.js',
            'src/music.js',
            'src/player-graphics.js',
            'src/svg-renderer.js',
            'src/svg-player-renderer.js',
            'src/svg-enemy-renderer.js',
            'src/svg-item-renderer.js',
            'src/game.js'
        ];
        
        for (const script of scripts) {
            const scriptPath = path.join(__dirname, script);
            const code = fs.readFileSync(scriptPath, 'utf8');
            eval(code);
            console.log(`✅ ${script} 読み込み完了`);
        }
        
        console.log('📋 Gameクラス確認:', typeof Game);
        console.log('📋 LevelLoaderクラス確認:', typeof LevelLoader);
        
        // Gameインスタンス作成テスト
        const game = new Game();
        console.log('✅ Game インスタンス作成成功');
        
        // 非同期初期化テスト
        await game.initialize();
        console.log('✅ Game 初期化完了');
        
        return { success: true, logs };
        
    } catch (error) {
        console.error('❌ エラー発生:', error.message);
        console.error('❌ スタック:', error.stack);
        return { success: false, error: error.message, stack: error.stack, logs };
    }
}

// テスト実行
testGameInitialization().then(result => {
    console.log('\n📊 テスト結果:');
    console.log('成功:', result.success);
    if (!result.success) {
        console.log('エラー:', result.error);
    }
    
    console.log('\n📝 収集されたログ:');
    result.logs.forEach((log, index) => {
        console.log(`${index + 1}. [${log.type}] ${log.message}`);
    });
    
    process.exit(result.success ? 0 : 1);
});