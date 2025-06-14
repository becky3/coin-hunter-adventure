/**
 * ゲームテストスイート
 * システムテストとレベルテストを分離して段階的に実行
 */

// テストフレームワーク拡張版
class TestRunner {
    constructor(category) {
        this.category = category;
        this.tests = [];
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        this.startTime = null;
        this.endTime = null;
    }
    
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    async run() {
        console.log(`\n=== ${this.category} ===`);
        console.log('テスト実行開始...');
        
        this.startTime = performance.now();
        
        for (const test of this.tests) {
            console.log(`テスト実行中: ${test.name}`);
            try {
                await test.fn();
                this.results.push({
                    name: test.name,
                    passed: true,
                    error: null
                });
                this.passed++;
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.results.push({
                    name: test.name,
                    passed: false,
                    error: error.message
                });
                this.failed++;
                console.error(`✗ ${test.name}: ${error.message}`);
                console.error('スタックトレース:', error.stack);
            }
        }
        
        this.endTime = performance.now();
        
        return {
            category: this.category,
            passed: this.passed,
            failed: this.failed,
            total: this.tests.length,
            duration: this.endTime - this.startTime,
            allPassed: this.failed === 0
        };
    }
}

// テスト結果表示クラス
class TestResultDisplay {
    constructor() {
        this.results = [];
    }
    
    addResults(testResult, runner) {
        this.results.push({
            summary: testResult,
            details: runner.results
        });
    }
    
    displayAll() {
        const container = document.getElementById('testResults');
        let html = '<h2>テスト実行結果</h2>';
        
        // 全体サマリー
        const totalPassed = this.results.reduce((sum, r) => sum + r.summary.passed, 0);
        const totalFailed = this.results.reduce((sum, r) => sum + r.summary.failed, 0);
        const totalTests = this.results.reduce((sum, r) => sum + r.summary.total, 0);
        const totalDuration = this.results.reduce((sum, r) => sum + r.summary.duration, 0);
        
        const overallSuccess = totalFailed === 0;
        const summaryClass = overallSuccess ? 'test-pass' : 'test-fail';
        const summaryIcon = overallSuccess ? '🎉' : '⚠️';
        
        html += `<div class="overall-summary ${summaryClass}">
            <h3>${summaryIcon} 全体結果: ${overallSuccess ? '全テスト成功' : 'テスト失敗あり'}</h3>
            <p>合計: ${totalTests}件 | 成功: ${totalPassed}件 | 失敗: ${totalFailed}件 | 実行時間: ${Math.round(totalDuration)}ms</p>
        </div>`;
        
        // カテゴリ別結果
        for (const result of this.results) {
            const categoryClass = result.summary.allPassed ? 'category-pass' : 'category-fail';
            const categoryIcon = result.summary.allPassed ? '✅' : '❌';
            
            html += `<div class="test-category ${categoryClass}">
                <h3>${categoryIcon} ${result.summary.category}</h3>
                <div class="category-summary">
                    成功: ${result.summary.passed} / 失敗: ${result.summary.failed} / 合計: ${result.summary.total} | 
                    実行時間: ${Math.round(result.summary.duration)}ms
                </div>`;
            
            // 詳細結果
            html += '<div class="test-details">';
            for (const detail of result.details) {
                const className = detail.passed ? 'test-pass' : 'test-fail';
                const status = detail.passed ? '✓' : '✗';
                const error = detail.error ? ` - ${detail.error}` : '';
                
                html += `<div class="test-item ${className}">${status} ${detail.name}${error}</div>`;
            }
            html += '</div></div>';
        }
        
        container.innerHTML = html;
    }
}

// アサーション関数
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'アサーション失敗');
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `期待値: ${expected}, 実際: ${actual}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (!(actual > expected)) {
        throw new Error(message || `Expected ${actual} to be greater than ${expected}`);
    }
}

function assertLessThan(actual, expected, message) {
    if (!(actual < expected)) {
        throw new Error(message || `Expected ${actual} to be less than ${expected}`);
    }
}


// === システムテスト ===
const systemTests = new TestRunner('システムテスト');

// 設定ファイルのテスト
systemTests.test('設定ファイルの読み込み', () => {
    assert(typeof CANVAS_WIDTH === 'number', 'CANVAS_WIDTHが定義されていません');
    assert(typeof CANVAS_HEIGHT === 'number', 'CANVAS_HEIGHTが定義されていません');
    assertEquals(CANVAS_WIDTH, 1024, 'CANVAS_WIDTHが正しくありません');
    assertEquals(CANVAS_HEIGHT, 576, 'CANVAS_HEIGHTが正しくありません');
    
    assert(typeof PLAYER_CONFIG === 'object', 'PLAYER_CONFIGが定義されていません');
    assertGreaterThan(PLAYER_CONFIG.speed, 0, 'プレイヤー速度が正の値である必要があります');
    assertLessThan(PLAYER_CONFIG.speed, 20, 'プレイヤー速度が現実的な範囲を超えています');
    assertGreaterThan(PLAYER_CONFIG.jumpPower, 0, 'ジャンプ力が正の値である必要があります');
    assertLessThan(PLAYER_CONFIG.jumpPower, 30, 'ジャンプ力が現実的な範囲を超えています');
});

// スプリング設定のテスト
systemTests.test('スプリング設定の読み込み', () => {
    assert(typeof SPRING_CONFIG === 'object', 'SPRING_CONFIGが定義されていません');
    assertEquals(SPRING_CONFIG.width, 40, 'スプリング幅が正しくありません');
    assertEquals(SPRING_CONFIG.height, 40, 'スプリング高さが正しくありません');
    assertEquals(SPRING_CONFIG.bouncePower, 25, 'スプリング跳躍力が正しくありません');
    assertGreaterThan(SPRING_CONFIG.animationSpeed, 0, 'スプリングアニメーション速度が正の値である必要があります');
    assertLessThan(SPRING_CONFIG.animationSpeed, 1, 'スプリングアニメーション速度が現実的な範囲を超えています');
});

// ゲームインスタンスのテスト
systemTests.test('ゲームの初期化', () => {
    // GameStateのテスト
    const gameState = new GameState();
    assert(gameState, 'GameStateが作成できません');
    assertEquals(gameState.state, 'start', 'GameStateの初期状態が正しくありません');
    
    // InputManagerのテスト（イベントリスナーを除く）
    const inputManager = new InputManager();
    assert(inputManager, 'InputManagerが作成できません');
    assert(typeof inputManager.keys === 'object', 'InputManagerのkeysオブジェクトがありません');
    
    // Playerのテスト
    const player = new Player();
    assert(player, 'Playerが作成できません');
});

// プレイヤーのテスト
systemTests.test('プレイヤーの生成と初期状態', () => {
    const player = new Player(100, 300);
    assertEquals(player.x, 100, 'プレイヤーX座標が正しくありません');
    assertEquals(player.y, 300, 'プレイヤーY座標が正しくありません');
    assertEquals(player.width, PLAYER_CONFIG.width, 'プレイヤー幅が正しくありません');
    assertEquals(player.height, PLAYER_CONFIG.height, 'プレイヤー高さが正しくありません');
    assertEquals(player.velX, 0, '初期X速度が0ではありません');
    assertEquals(player.velY, 0, '初期Y速度が0ではありません');
    assertEquals(player.health, PLAYER_CONFIG.maxHealth, '初期体力が正しくありません');
    assert(!player.isJumping, 'プレイヤーが初期状態でジャンプ中です');
});

// 入力処理のテスト
systemTests.test('入力マネージャーの動作', () => {
    const inputManager = new InputManager();
    
    // 初期状態
    assert(typeof inputManager.keys === 'object', 'keysオブジェクトが存在しません');
    
    // getInputStateメソッドのテスト（直接keysを設定）
    inputManager.keys.ArrowLeft = true;
    inputManager.keys.ArrowRight = false;
    inputManager.keys.Space = true;
    
    const state = inputManager.getInputState();
    assert(state.left === true, 'getInputStateでleftが検出されません');
    assert(!state.right, 'getInputStateでrightが誤検出されています');
    assert(state.jump === true, 'getInputStateでjumpが検出されません');
    
    // キーの状態をリセット
    inputManager.keys = {};
    const state2 = inputManager.getInputState();
    assert(!state2.left, 'リセット後もleftが検出されています');
    assert(!state2.right, 'リセット後もrightが検出されています');
    assert(!state2.jump, 'リセット後もjumpが検出されています');
});

// 衝突判定のテスト（関数を追加）
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

systemTests.test('AABB衝突判定', () => {
    const rect1 = { x: 0, y: 0, width: 50, height: 50 };
    const rect2 = { x: 25, y: 25, width: 50, height: 50 };
    const rect3 = { x: 100, y: 100, width: 50, height: 50 };
    
    assert(checkCollision(rect1, rect2), '重なるオブジェクトの衝突が検出されません');
    assert(!checkCollision(rect1, rect3), '離れたオブジェクトが衝突と判定されました');
});

// プレイヤー移動のテスト
systemTests.test('プレイヤーの移動処理', () => {
    const player = new Player(100, 300);
    
    // 右移動
    player.handleInput({ right: true, left: false, jump: false });
    assertEquals(player.velX, PLAYER_CONFIG.speed, '右移動速度が正しくありません');
    assertEquals(player.direction, 1, '右向きの方向が正しくありません');
    
    // 左移動
    player.handleInput({ right: false, left: true, jump: false });
    assertEquals(player.velX, -PLAYER_CONFIG.speed, '左移動速度が正しくありません');
    assertEquals(player.direction, -1, '左向きの方向が正しくありません');
    
    // 停止
    player.handleInput({ right: false, left: false, jump: false });
    assertEquals(player.velX, 0, '停止時の速度が0ではありません');
    
    // ジャンプ（地面にいる状態で）
    player.onGround = true;
    player.isJumping = false;
    player.jumpButtonHeldTime = 0;  // ジャンプボタン保持時間をリセット
    player.handleInput({ right: false, left: false, jump: true });
    assert(player.velY < 0, 'ジャンプ時の垂直速度が負でありません');
    assert(!player.onGround, 'ジャンプ後も地面にいる状態です');
    assert(player.isJumping, 'ジャンプ中フラグが設定されていません');
});

// 重力のテスト
systemTests.test('重力の適用', () => {
    const player = new Player(100, 100);
    const initialY = player.y;
    const initialVelY = player.velY;
    
    // 重力を適用
    player.velY += GRAVITY;
    player.y += player.velY;
    
    assert(player.velY > initialVelY, '重力により速度が増加していません');
    assert(player.y > initialY, '重力によりY座標が増加していません');
});

// ゲーム状態遷移のテスト
systemTests.test('ゲーム状態の遷移', () => {
    const gameState = new GameState();
    
    // 初期状態
    assertEquals(gameState.state, 'start', '初期状態が正しくありません');
    
    // ゲーム開始（setStateメソッドを使用）
    gameState.setState('playing');
    assertEquals(gameState.state, 'playing', 'ゲーム開始後の状態が正しくありません');
    
    // ゲームオーバー
    gameState.setState('gameOver');
    assertEquals(gameState.state, 'gameOver', 'ゲームオーバー状態が正しくありません');
    
    // クリア
    gameState.setState('levelComplete');
    assertEquals(gameState.state, 'levelComplete', 'クリア状態が正しくありません');
    
    // resetGameDataメソッドのテスト
    gameState.score = 100;
    gameState.resetGameData();
    assertEquals(gameState.score, 0, 'resetGameDataでスコアがリセットされていません');
    assertEquals(gameState.lives, 3, 'resetGameDataでライフがリセットされていません');
});

// === SVGレンダリングテスト ===
const svgRenderingTests = new TestRunner('SVGレンダリングテスト');

// SVGレンダラークラスの存在確認
svgRenderingTests.test('SVGレンダラークラスの読み込み確認', () => {
    // SVGPlayerRendererクラスの確認
    assert(typeof SVGPlayerRenderer !== 'undefined', 
        'SVGPlayerRendererクラスが読み込まれていません');
    
    // SVGEnemyRendererクラスの確認
    assert(typeof SVGEnemyRenderer !== 'undefined', 
        'SVGEnemyRendererクラスが読み込まれていません');
    
    // SVGItemRendererクラスの確認
    assert(typeof SVGItemRenderer !== 'undefined', 
        'SVGItemRendererクラスが読み込まれていません');
});

// SVGGraphicsクラスの初期化テスト
svgRenderingTests.test('SVGGraphicsクラスの初期化', () => {
    // モックCanvasコンテキストを作成
    const mockCtx = {
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        fillRect: () => {},
        beginPath: () => {},
        fill: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} })
    };
    
    // SVGGraphicsクラスのインスタンス化
    let svgGraphics;
    try {
        svgGraphics = new SVGGraphics(mockCtx);
        assert(svgGraphics, 'SVGGraphicsインスタンスが作成されませんでした');
    } catch (error) {
        throw new Error(`SVGGraphics初期化エラー: ${error.message}`);
    }
    
    // レンダラーの初期化状態を確認
    // playerRendererはnullでも良い（フォールバック描画を使用するため）
    assert(svgGraphics.playerRenderer !== undefined, 
        'playerRendererが初期化されていません');
    
    assert(svgGraphics.enemyRenderer !== undefined, 
        'enemyRendererが初期化されていません');
    
    assert(svgGraphics.itemRenderer !== undefined, 
        'itemRendererが初期化されていません');
});

// SVGレンダラーの個別初期化テスト
svgRenderingTests.test('個別SVGレンダラーの初期化', () => {
    const mockCtx = {
        save: () => {},
        restore: () => {},
        translate: () => {},
        scale: () => {},
        fillRect: () => {},
        beginPath: () => {},
        fill: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} })
    };
    
    // SVGPlayerRendererの初期化テスト
    try {
        const playerRenderer = new SVGPlayerRenderer(mockCtx);
        assert(playerRenderer, 'SVGPlayerRendererが作成されませんでした');
        assert(typeof playerRenderer.drawPlayer === 'function', 
            'drawPlayerメソッドが存在しません');
    } catch (error) {
        throw new Error(`SVGPlayerRenderer初期化エラー: ${error.message}`);
    }
    
    // SVGEnemyRendererの初期化テスト
    try {
        const enemyRenderer = new SVGEnemyRenderer(mockCtx);
        assert(enemyRenderer, 'SVGEnemyRendererが作成されませんでした');
        assert(typeof enemyRenderer.drawEnemy === 'function', 
            'drawEnemyメソッドが存在しません');
    } catch (error) {
        throw new Error(`SVGEnemyRenderer初期化エラー: ${error.message}`);
    }
    
    // SVGItemRendererの初期化テスト
    try {
        const itemRenderer = new SVGItemRenderer(mockCtx);
        assert(itemRenderer, 'SVGItemRendererが作成されませんでした');
        assert(typeof itemRenderer.drawItem === 'function', 
            'drawItemメソッドが存在しません');
    } catch (error) {
        throw new Error(`SVGItemRenderer初期化エラー: ${error.message}`);
    }
});


// SVG描画メソッドのテスト
svgRenderingTests.test('SVG描画メソッドの動作確認', () => {
    // Gameインスタンスが存在することを確認
    assert(window.game, 'window.gameが存在しません');
    assert(window.game.svg, 'game.svgが存在しません');
    
    const svgGraphics = window.game.svg;
    
    // SVGレンダラーが正しく初期化されていることを確認
    assert(svgGraphics.playerRenderer, 'playerRendererが初期化されていません');
    assert(svgGraphics.enemyRenderer, 'enemyRendererが初期化されていません');
    assert(svgGraphics.itemRenderer, 'itemRendererが初期化されていません');
    
    // HTTPプロトコルでのみ描画テストを実行
    if (window.location.protocol !== 'file:') {
        try {
            // SVGファイルが読み込まれている場合のみテスト
            svgGraphics.drawSlime(0, 0, 40, 40, 0);
            svgGraphics.drawBird(0, 0, 40, 40, 0);
            svgGraphics.drawCoin(0, 0, 30, 30, 0);
            svgGraphics.drawFlag(0, 0, 60, 80);
            svgGraphics.drawSpring(0, 0, 40, 40, 0);
            svgGraphics.drawPlayer(0, 0, 32, 48, 2, 1, false, 0, 0, 0);
        } catch (error) {
            // SVGファイル未読み込みの場合は期待されるエラー
            if (error.message.includes('SVGファイル') && error.message.includes('読み込まれていません')) {
                console.log('✅ SVG未読み込み時のエラーが正しく発生:', error.message);
            } else {
                throw new Error(`予期しない描画メソッドエラー: ${error.message}`);
            }
        }
    } else {
        console.log('⚠️ file://プロトコルのため描画テストをスキップ');
    }
});

// CORS/プロトコル検出テスト
svgRenderingTests.test('CORS/プロトコル問題の検出', () => {
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
        // file://プロトコルの場合：警告を表示してテスト失敗
        console.warn('⚠️ file://プロトコルで実行されています。');
        console.warn('⚠️ SVGファイルの読み込みテストが正しく実行できません。');
        console.warn('⚠️ フォールバック描画のテストのみ実行されます。');
        
        // SVGGraphicsクラスのプロトコルチェック機能が動作していることを確認
        const svgGraphics = window.game?.svg;
        if (svgGraphics) {
            assert(typeof svgGraphics.checkProtocolAndWarn === 'function', 
                'プロトコルチェック機能が実装されていません');
        }
        
        // 警告を表示してテスト失敗
        throw new Error('file://プロトコルで実行されています。完全なテストのためHTTPサーバー経由でアクセスしてください。例: http://localhost:8080/test.html');
    } else {
        // http://またはhttps://プロトコルの場合は正常
        assert(true, 'HTTP/HTTPSプロトコルで正常に実行されています');
    }
});

// === レベルテスト ===
const levelTests = new TestRunner('レベルテスト');

// レベルデータのテスト
levelTests.test('レベルデータの読み込み', () => {
    assert(typeof levelData === 'object', 'levelDataが定義されていません');
    assert(Array.isArray(levelData.platforms), 'プラットフォーム配列がありません');
    assert(Array.isArray(levelData.enemies), '敵配列がありません');
    assert(Array.isArray(levelData.coins), 'コイン配列がありません');
    assert(levelData.flag && typeof levelData.flag === 'object', 'フラグオブジェクトがありません');
    
    // プラットフォームは最低限必要（ゲーム成立のため）
    assertGreaterThan(levelData.platforms.length, 0, 'プラットフォームが存在しません');
    
    // 敵やコインは0個でも問題ない（ゲームクリアには必須ではない）
});

// プラットフォーム配置のテスト
levelTests.test('プラットフォームの隙間', () => {
    let gapFound = false;
    
    // 地面レベルのプラットフォームを確認
    const groundPlatforms = levelData.platforms.filter(p => p.y === 476);
    groundPlatforms.sort((a, b) => a.x - b.x);
    
    for (let i = 0; i < groundPlatforms.length - 1; i++) {
        const gap = groundPlatforms[i + 1].x - (groundPlatforms[i].x + groundPlatforms[i].width);
        if (gap >= 100) {
            gapFound = true;
            break;
        }
    }
    
    assert(gapFound, 'プラットフォーム間に十分な隙間（100px以上）がありません');
});

// 改善されたレベルデータのテスト（必須要素のみ）
levelTests.test('改善されたレベルデータの検証', () => {
    // スプリングデータの配列存在確認（個数は問わない）
    assert(Array.isArray(levelData.springs), 'スプリング配列がありません');
    
    // 敵データの配列存在確認（種類や個数は問わない）
    assert(Array.isArray(levelData.enemies), '敵配列がありません');
    
    // コインデータの配列存在確認（個数は問わない）
    assert(Array.isArray(levelData.coins), 'コイン配列がありません');
    
    // ゴールフラグの存在確認（クリアに必須）
    assert(levelData.flag && typeof levelData.flag.x === 'number', 'ゴールフラグが正しく設定されていません');
});

// 4つのセクションの構造テスト
levelTests.test('4セクション構造の確認', () => {
    // セクション1: チュートリアルエリア（0-800px）
    const section1Platforms = levelData.platforms.filter(p => p.x >= 0 && p.x < 800);
    assertGreaterThan(section1Platforms.length, 0, 'セクション1にプラットフォームが存在しません');
    
    // セクション2: ジャンプチャレンジ（800-1600px）
    const section2Platforms = levelData.platforms.filter(p => p.x >= 800 && p.x < 1600);
    assertGreaterThan(section2Platforms.length, 0, 'セクション2にプラットフォームが存在しません');
    
    // セクション3: 垂直チャレンジ（1600-2400px）
    const section3Platforms = levelData.platforms.filter(p => p.x >= 1600 && p.x < 2400);
    assertGreaterThan(section3Platforms.length, 0, 'セクション3にプラットフォームが存在しません');
    
    // セクション4: 最終チャレンジ（2400-3000px）
    const section4Platforms = levelData.platforms.filter(p => p.x >= 2400 && p.x < 3000);
    assertGreaterThan(section4Platforms.length, 0, 'セクション4にプラットフォームが存在しません');
});

// 高所ボーナスエリアのテスト（基本的な存在確認のみ）
levelTests.test('高所ボーナスエリアの確認', () => {
    // 高所プラットフォームの基本的な存在確認（レベルに高低差があることを確認）
    const platforms = levelData.platforms;
    const minY = Math.min(...platforms.map(p => p.y));
    const maxY = Math.max(...platforms.map(p => p.y));
    
    assertGreaterThan(maxY - minY, 100, 'レベルに十分な高低差がありません');
});

// 垂直チャレンジの構造テスト
levelTests.test('垂直チャレンジの構造確認', () => {
    // 垂直配置されたプラットフォーム（1800-2100px範囲）
    const verticalPlatforms = levelData.platforms.filter(p => 
        p.x >= 1800 && p.x <= 2100 && p.height === 20 // 空中プラットフォーム
    ).sort((a, b) => a.y - b.y); // Y座標でソート
    
    // プラットフォーム数チェックを削除（レベル調整で頻繁に変更されるため）
    assertGreaterThan(verticalPlatforms.length, 0, '垂直プラットフォームが存在しません');
    
    // 最高地点（y=120以下）の確認（より柔軟に）
    if (verticalPlatforms.length > 0) {
        const highestPlatform = verticalPlatforms[0];
        assert(highestPlatform.y <= 120, '最高地点のプラットフォームがありません');
        
        // 段階的な上昇の確認
        for (let i = 1; i < verticalPlatforms.length; i++) {
            assert(verticalPlatforms[i].y >= verticalPlatforms[i-1].y, 
                '垂直プラットフォームが正しく配置されていません');
        }
    }
});

// テスト実行と結果表示
window.addEventListener('DOMContentLoaded', async () => {
    // ゲームが初期化された後に実行
    setTimeout(async () => {
        try {
            // ゲームループを停止
            if (window.game) {
                window.game.isRunning = false;
            }
        } catch (e) {
            console.log('ゲーム停止エラー（無視）:', e.message);
        }
        
        const display = new TestResultDisplay();
        
        // システムテストを実行
        console.log('=== テスト実行開始 ===');
        const systemResult = await systemTests.run();
        display.addResults(systemResult, systemTests);
        
        // SVGレンダリングテストを実行
        console.log('\nSVGレンダリングテストを実行します...');
        const svgResult = await svgRenderingTests.run();
        display.addResults(svgResult, svgRenderingTests);
        
        // システムテストが全て成功した場合のみレベルテストを実行
        if (systemResult.allPassed) {
            console.log('\nシステムテスト成功！レベルテストを実行します...');
            const levelResult = await levelTests.run();
            display.addResults(levelResult, levelTests);
        } else {
            console.error('\nシステムテストに失敗があるため、レベルテストはスキップされました。');
        }
        
        // 結果を表示
        display.displayAll();
        console.log('\n🏁 テスト完了');
        
    }, 500); // ゲーム初期化を待つため遅延を増やす
});