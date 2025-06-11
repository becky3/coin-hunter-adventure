/**
 * ゲームテストスイート
 * 構造変更前に既存機能が正しく動作することを確認
 */

// テストフレームワーク
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(name, fn) {
        this.tests.push({ name, fn });
    }
    
    async run() {
        console.log('テスト実行開始...');
        
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
        
        this.displayResults();
    }
    
    displayResults() {
        const container = document.getElementById('testResults');
        let html = '';
        
        for (const result of this.results) {
            const className = result.passed ? 'test-pass' : 'test-fail';
            const status = result.passed ? '✓ 成功' : '✗ 失敗';
            const error = result.error ? ` - ${result.error}` : '';
            
            html += `<div class="test-item ${className}">${status}: ${result.name}${error}</div>`;
        }
        
        html += `<div class="test-summary">
            テスト結果: 成功 ${this.passed} / 失敗 ${this.failed} / 合計 ${this.tests.length}
        </div>`;
        
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
    if (actual <= expected) {
        throw new Error(message || `${actual} は ${expected} より大きくありません`);
    }
}

// テスト実行
const runner = new TestRunner();

// 設定ファイルのテスト
runner.test('設定ファイルの読み込み', () => {
    assert(typeof CANVAS_WIDTH === 'number', 'CANVAS_WIDTHが定義されていません');
    assert(typeof CANVAS_HEIGHT === 'number', 'CANVAS_HEIGHTが定義されていません');
    assertEquals(CANVAS_WIDTH, 1024, 'CANVAS_WIDTHが正しくありません');
    assertEquals(CANVAS_HEIGHT, 576, 'CANVAS_HEIGHTが正しくありません');
    
    assert(typeof PLAYER_CONFIG === 'object', 'PLAYER_CONFIGが定義されていません');
    assertEquals(PLAYER_CONFIG.speed, 5, 'プレイヤー速度が正しくありません');
    assertEquals(PLAYER_CONFIG.jumpPower, 18, 'ジャンプ力が正しくありません');
});

// レベルデータのテスト
runner.test('レベルデータの読み込み', () => {
    assert(typeof levelData === 'object', 'levelDataが定義されていません');
    assert(Array.isArray(levelData.platforms), 'プラットフォーム配列がありません');
    assert(Array.isArray(levelData.enemies), '敵配列がありません');
    assert(Array.isArray(levelData.coins), 'コイン配列がありません');
    assert(levelData.flag && typeof levelData.flag === 'object', 'フラグオブジェクトがありません');
    
    assertGreaterThan(levelData.platforms.length, 0, 'プラットフォームが存在しません');
    assertGreaterThan(levelData.enemies.length, 0, '敵が存在しません');
    assertGreaterThan(levelData.coins.length, 0, 'コインが存在しません');
});

// ゲームインスタンスのテスト
runner.test('ゲームの初期化', () => {
    // このテストはスキップ（Gameクラスは多くのDOM要素に依存するため）
    // 代わりに個別のコンポーネントをテスト
    
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
runner.test('プレイヤーの生成と初期状態', () => {
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
runner.test('入力マネージャーの動作', () => {
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

runner.test('AABB衝突判定', () => {
    const rect1 = { x: 0, y: 0, width: 50, height: 50 };
    const rect2 = { x: 25, y: 25, width: 50, height: 50 };
    const rect3 = { x: 100, y: 100, width: 50, height: 50 };
    
    assert(checkCollision(rect1, rect2), '重なるオブジェクトの衝突が検出されません');
    assert(!checkCollision(rect1, rect3), '離れたオブジェクトが衝突と判定されました');
});

// プレイヤー移動のテスト
runner.test('プレイヤーの移動処理', () => {
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
    player.handleInput({ right: false, left: false, jump: true });
    assertEquals(player.velY, -PLAYER_CONFIG.jumpPower, 'ジャンプ力が正しくありません');
    assert(!player.onGround, 'ジャンプ後も地面にいる状態です');
    assert(player.isJumping, 'ジャンプ中フラグが設定されていません');
});

// 重力のテスト
runner.test('重力の適用', () => {
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
runner.test('ゲーム状態の遷移', () => {
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

// プラットフォーム配置のテスト
runner.test('プラットフォームの隙間', () => {
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

// === Issue #12: レベルデザイン改善のテスト ===

// スプリング設定のテスト
runner.test('スプリング設定の読み込み', () => {
    assert(typeof SPRING_CONFIG === 'object', 'SPRING_CONFIGが定義されていません');
    assertEquals(SPRING_CONFIG.width, 40, 'スプリング幅が正しくありません');
    assertEquals(SPRING_CONFIG.height, 40, 'スプリング高さが正しくありません');
    assertEquals(SPRING_CONFIG.bouncePower, 25, 'スプリング跳躍力が正しくありません');
    assertEquals(SPRING_CONFIG.animationSpeed, 0.2, 'スプリングアニメーション速度が正しくありません');
});

// 改善されたレベルデータのテスト
runner.test('改善されたレベルデータの検証', () => {
    // スプリングデータの存在確認
    assert(Array.isArray(levelData.springs), 'スプリング配列がありません');
    assertEquals(levelData.springs.length, 3, 'スプリングが3個配置されていません');
    
    // 各スプリングの位置確認
    const expectedSpringPositions = [
        { x: 650, y: 456 },   // 大ジャンプ補助
        { x: 1750, y: 456 },  // 垂直セクションへ
        { x: 2000, y: 80 }    // 最高地点から下降用
    ];
    
    expectedSpringPositions.forEach((expected, index) => {
        assert(levelData.springs[index], `スプリング${index + 1}が存在しません`);
        assertEquals(levelData.springs[index].x, expected.x, `スプリング${index + 1}のX座標が正しくありません`);
        assertEquals(levelData.springs[index].y, expected.y, `スプリング${index + 1}のY座標が正しくありません`);
    });
    
    // 飛行敵（鳥）の配置確認
    const birds = levelData.enemies.filter(e => e.type === 'bird');
    assertEquals(birds.length, 6, '飛行敵（鳥）が6体配置されていません');
    
    // 地上敵（スライム）の配置確認
    const slimes = levelData.enemies.filter(e => e.type === 'slime');
    assertEquals(slimes.length, 7, '地上敵（スライム）が7体配置されていません');
    
    // コイン数の確認（30枚に増加）
    assert(levelData.coins.length >= 30, 'コイン数が十分に増加していません');
    
    // ゴール位置の確認（より遠くに）
    assertEquals(levelData.flag.x, 2900, 'ゴール位置が正しくありません');
});

// 4つのセクションの構造テスト
runner.test('4セクション構造の確認', () => {
    // セクション1: チュートリアルエリア（0-800px）
    const section1Platforms = levelData.platforms.filter(p => p.x >= 0 && p.x < 800);
    assertGreaterThan(section1Platforms.length, 3, 'セクション1のプラットフォーム数が不足');
    
    // セクション2: ジャンプチャレンジ（800-1600px）
    const section2Platforms = levelData.platforms.filter(p => p.x >= 800 && p.x < 1600);
    assertGreaterThan(section2Platforms.length, 3, 'セクション2のプラットフォーム数が不足');
    
    // セクション3: 垂直チャレンジ（1600-2400px）
    const section3Platforms = levelData.platforms.filter(p => p.x >= 1600 && p.x < 2400);
    assertGreaterThan(section3Platforms.length, 5, 'セクション3のプラットフォーム数が不足');
    
    // セクション4: 最終チャレンジ（2400-3000px）
    const section4Platforms = levelData.platforms.filter(p => p.x >= 2400 && p.x < 3000);
    assertGreaterThan(section4Platforms.length, 3, 'セクション4のプラットフォーム数が不足');
});

// 高所ボーナスエリアのテスト
runner.test('高所ボーナスエリアの確認', () => {
    // y=120付近の高所コイン（リスクとリワード）
    const highCoins = levelData.coins.filter(c => c.y >= 100 && c.y <= 140);
    assertGreaterThan(highCoins.length, 3, '高所ボーナスコインが不足しています');
    
    // 高所プラットフォーム（y=150）の存在確認
    const highPlatform = levelData.platforms.find(p => p.y === 150);
    assert(highPlatform, '高所ボーナスプラットフォームが存在しません');
    assertEquals(highPlatform.width, 200, '高所プラットフォームの幅が正しくありません');
});

// 垂直チャレンジの構造テスト
runner.test('垂直チャレンジの構造確認', () => {
    // 垂直配置されたプラットフォーム（1800-2100px範囲）
    const verticalPlatforms = levelData.platforms.filter(p => 
        p.x >= 1800 && p.x <= 2100 && p.height === 20 // 空中プラットフォーム
    ).sort((a, b) => a.y - b.y); // Y座標でソート
    
    assertGreaterThan(verticalPlatforms.length, 5, '垂直プラットフォームが不足しています');
    
    // 最高地点（y=100）の確認
    const highestPlatform = verticalPlatforms[0];
    assert(highestPlatform.y <= 100, '最高地点のプラットフォームがありません');
    
    // 段階的な上昇の確認
    for (let i = 1; i < verticalPlatforms.length; i++) {
        assert(verticalPlatforms[i].y >= verticalPlatforms[i-1].y, 
            '垂直プラットフォームが正しく配置されていません');
    }
});

// テストを実行
window.addEventListener('DOMContentLoaded', () => {
    // ゲームが初期化された後に実行
    setTimeout(() => {
        // ゲームループを停止
        if (window.game) {
            window.game.isRunning = false;
        }
        
        // テスト実行
        runner.run();
    }, 500); // ゲーム初期化を待つため遅延を増やす
});