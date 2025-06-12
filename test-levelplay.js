/**
 * レベルテストプレイ自動化スクリプト
 * レベルがクリア可能かどうかを自動でテストする
 */

// テストプレイヤーAIクラス
class TestPlayer {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        this.actionLog = [];
        this.stuckCounter = 0;
        this.lastPosition = { x: 0, y: 0 };
        this.targetX = null;
    }
    
    // 現在の状況を分析
    analyzeEnvironment() {
        const platforms = this.game.platforms.filter(p => {
            const relX = p.x - this.player.x;
            return relX > -100 && relX < 300; // 近くのプラットフォームのみ
        });
        
        const enemies = this.game.enemies.filter(e => {
            const relX = e.x - this.player.x;
            const relY = e.y - this.player.y;
            return Math.abs(relX) < 200 && Math.abs(relY) < 100;
        });
        
        const coins = this.game.coins.filter(c => {
            if (c.collected) return false;
            const relX = c.x - this.player.x;
            const relY = c.y - this.player.y;
            return Math.abs(relX) < 150 && Math.abs(relY) < 100;
        });
        
        const springs = this.game.springs.filter(s => {
            const relX = s.x - this.player.x;
            return relX > -50 && relX < 100;
        });
        
        return { platforms, enemies, coins, springs };
    }
    
    // 次の行動を決定
    decideAction() {
        const env = this.analyzeEnvironment();
        const inputState = { left: false, right: false, jump: false };
        
        // スタック検出
        if (Math.abs(this.player.x - this.lastPosition.x) < 1 && 
            Math.abs(this.player.y - this.lastPosition.y) < 1) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        this.lastPosition = { x: this.player.x, y: this.player.y };
        
        // スタックしている場合はランダムな行動
        if (this.stuckCounter > 30) {
            this.actionLog.push('スタック検出 - ランダム行動');
            inputState.jump = Math.random() > 0.3;
            inputState.right = Math.random() > 0.5;
            inputState.left = !inputState.right;
            this.stuckCounter = 0;
            return inputState;
        }
        
        // 基本的に右に進む
        inputState.right = true;
        
        // 敵回避
        const nearbyEnemy = env.enemies.find(e => {
            const relX = e.x - this.player.x;
            const relY = e.y - this.player.y;
            return relX > -30 && relX < 60 && Math.abs(relY) < 60;
        });
        
        if (nearbyEnemy) {
            const relX = nearbyEnemy.x - this.player.x;
            if (relX > 0 && this.player.onGround) {
                inputState.jump = true;
                this.actionLog.push('敵を回避ジャンプ');
            }
        }
        
        // プラットフォーム間のジャンプ
        const currentPlatform = env.platforms.find(p => 
            this.player.x >= p.x && 
            this.player.x <= p.x + p.width &&
            Math.abs(this.player.y + this.player.height - p.y) < 5
        );
        
        if (currentPlatform) {
            // 現在のプラットフォームの端に近い場合
            const distToRightEdge = (currentPlatform.x + currentPlatform.width) - this.player.x;
            if (distToRightEdge < 50 && this.player.onGround) {
                // 次のプラットフォームを探す
                const nextPlatform = env.platforms.find(p => 
                    p.x > currentPlatform.x + currentPlatform.width &&
                    p.x < currentPlatform.x + currentPlatform.width + 200
                );
                
                if (nextPlatform) {
                    const gap = nextPlatform.x - (currentPlatform.x + currentPlatform.width);
                    if (gap > 60) { // ジャンプが必要な隙間
                        inputState.jump = true;
                        this.actionLog.push('プラットフォーム間ジャンプ');
                    }
                }
            }
        }
        
        // スプリング利用
        const nearbySpring = env.springs.find(s => {
            const relX = s.x - this.player.x;
            return relX > -20 && relX < 40 && !s.triggered;
        });
        
        if (nearbySpring && this.player.onGround) {
            const relX = nearbySpring.x - this.player.x;
            if (Math.abs(relX) < 30) {
                this.actionLog.push('スプリング利用');
                // スプリングの上にいるのでジャンプはしない
            }
        }
        
        // コイン収集（可能な場合）
        const nearbyCoin = env.coins.find(c => {
            const relX = c.x - this.player.x;
            const relY = c.y - this.player.y;
            return relX > 0 && relX < 100 && Math.abs(relY) < 50;
        });
        
        if (nearbyCoin) {
            this.targetX = nearbyCoin.x;
            if (nearbyCoin.y < this.player.y - 20 && this.player.onGround) {
                inputState.jump = true;
                this.actionLog.push('コイン獲得ジャンプ');
            }
        }
        
        // 落下防止
        if (!this.player.onGround && this.player.velY > 10) {
            // 落下中は左右の移動を慎重に
            const belowPlatform = env.platforms.find(p => {
                const relX = p.x - this.player.x;
                const relY = p.y - this.player.y;
                return relX > -p.width && relX < 50 && relY > 0 && relY < 200;
            });
            
            if (!belowPlatform) {
                inputState.right = false;
                this.actionLog.push('落下防止 - 移動停止');
            }
        }
        
        return inputState;
    }
    
    // 状態をログに記録
    logState() {
        const state = {
            position: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
            velocity: { x: this.player.velX, y: this.player.velY },
            onGround: this.player.onGround,
            health: this.player.health,
            score: this.game.gameState.score,
            coins: this.game.coins.filter(c => !c.collected).length,
            time: Math.round(performance.now() / 1000)
        };
        return state;
    }
}

// レベルテストプレイ実行クラス
class LevelTestplay {
    constructor() {
        this.results = [];
        this.maxTime = 120; // 最大120秒
        this.checkInterval = 100; // 100msごとにチェック
    }
    
    async runTest(levelName = 'default') {
        console.log(`\n=== レベル「${levelName}」のテストプレイ開始 ===`);
        
        // ゲームを初期化（モック環境）
        const game = this.initializeGame();
        const testPlayer = new TestPlayer(game);
        
        const startTime = performance.now();
        let frameCount = 0;
        let lastLogTime = startTime;
        
        // テストプレイループ
        const testInterval = setInterval(() => {
            frameCount++;
            
            // AIの行動決定
            const input = testPlayer.decideAction();
            game.player.handleInput(input);
            
            // ゲーム更新
            this.updateGame(game, 16); // 60FPSを想定
            
            // 定期的な状態ログ
            if (performance.now() - lastLogTime > 1000) {
                const state = testPlayer.logState();
                console.log(`時間: ${state.time}s, 位置: (${state.position.x}, ${state.position.y}), ` +
                           `体力: ${state.health}, スコア: ${state.score}, 残りコイン: ${state.coins}`);
                lastLogTime = performance.now();
            }
            
            // 終了条件チェック
            const result = this.checkEndCondition(game, startTime);
            if (result) {
                clearInterval(testInterval);
                result.frameCount = frameCount;
                result.actionLog = testPlayer.actionLog.slice(-20); // 最後の20アクション
                this.displayResult(result);
                this.results.push(result);
            }
            
        }, this.checkInterval);
    }
    
    initializeGame() {
        // 簡易的なゲーム初期化（実際のGameクラスのモック）
        const game = {
            player: new Player(100, 300),
            platforms: levelData.platforms,
            enemies: levelData.enemies.map(e => ({
                ...e,
                ...ENEMY_CONFIG[e.type],
                velX: e.type === 'bird' ? -ENEMY_CONFIG[e.type].speed : ENEMY_CONFIG[e.type].speed,
                direction: e.type === 'bird' ? -1 : 1,
                animTimer: 0,
                originalX: e.x,
                originalY: e.y
            })),
            coins: levelData.coins.map(c => ({
                ...c,
                ...COIN_CONFIG,
                collected: false
            })),
            springs: (levelData.springs || []).map(s => ({
                ...s,
                ...SPRING_CONFIG,
                triggered: false
            })),
            flag: levelData.flag,
            gameState: new GameState(),
            worldWidth: 3000,
            worldHeight: 600
        };
        
        game.gameState.setState('playing');
        return game;
    }
    
    updateGame(game, deltaTime) {
        const player = game.player;
        
        // プレイヤー更新
        player.update();
        
        // 重力
        player.velY += GRAVITY;
        player.velY = Math.min(player.velY, 20);
        
        // 移動
        player.x += player.velX;
        player.y += player.velY;
        
        // プラットフォーム衝突
        player.onGround = false;
        game.platforms.forEach(platform => {
            if (this.checkCollision(player, platform)) {
                if (player.velY > 0 && player.y < platform.y) {
                    player.y = platform.y - player.height;
                    player.velY = 0;
                    player.onGround = true;
                    player.isJumping = false;
                }
            }
        });
        
        // 敵との衝突
        game.enemies.forEach(enemy => {
            // 敵の移動
            enemy.x += enemy.velX;
            
            if (this.checkCollision(player, enemy)) {
                player.health--;
                player.invulnerable = true;
                setTimeout(() => player.invulnerable = false, 1000);
            }
        });
        
        // コイン収集
        game.coins.forEach(coin => {
            if (!coin.collected && this.checkCollision(player, coin)) {
                coin.collected = true;
                game.gameState.score += 10;
            }
        });
        
        // スプリング
        game.springs.forEach(spring => {
            if (!spring.triggered && this.checkCollision(player, spring)) {
                player.velY = -SPRING_CONFIG.bouncePower;
                spring.triggered = true;
                setTimeout(() => spring.triggered = false, 500);
            }
        });
        
        // ゴール判定
        if (this.checkCollision(player, game.flag)) {
            game.gameState.setState('levelComplete');
        }
        
        // 落下死判定
        if (player.y > game.worldHeight || player.health <= 0) {
            game.gameState.setState('gameOver');
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkEndCondition(game, startTime) {
        const currentTime = performance.now();
        const elapsedTime = (currentTime - startTime) / 1000;
        
        // クリア
        if (game.gameState.state === 'levelComplete') {
            return {
                success: true,
                reason: 'レベルクリア',
                time: elapsedTime,
                score: game.gameState.score,
                coinsCollected: game.coins.filter(c => c.collected).length,
                totalCoins: game.coins.length,
                health: game.player.health
            };
        }
        
        // ゲームオーバー
        if (game.gameState.state === 'gameOver') {
            return {
                success: false,
                reason: game.player.health <= 0 ? '体力なし' : '落下死',
                time: elapsedTime,
                score: game.gameState.score,
                progress: Math.round((game.player.x / game.flag.x) * 100),
                lastPosition: { x: game.player.x, y: game.player.y }
            };
        }
        
        // タイムアウト
        if (elapsedTime > this.maxTime) {
            return {
                success: false,
                reason: 'タイムアウト',
                time: elapsedTime,
                score: game.gameState.score,
                progress: Math.round((game.player.x / game.flag.x) * 100),
                lastPosition: { x: game.player.x, y: game.player.y }
            };
        }
        
        return null;
    }
    
    displayResult(result) {
        console.log('\n=== テストプレイ結果 ===');
        console.log(`結果: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`理由: ${result.reason}`);
        console.log(`時間: ${result.time.toFixed(1)}秒`);
        console.log(`スコア: ${result.score}`);
        
        if (result.success) {
            console.log(`収集コイン: ${result.coinsCollected}/${result.totalCoins}`);
            console.log(`残り体力: ${result.health}`);
        } else {
            console.log(`進行度: ${result.progress}%`);
            console.log(`最終位置: (${result.lastPosition.x}, ${result.lastPosition.y})`);
        }
        
        if (result.actionLog && result.actionLog.length > 0) {
            console.log('\n最後のアクション:');
            result.actionLog.forEach(action => console.log(`  - ${action}`));
        }
    }
}

// Node.js環境用のグローバル設定
if (typeof global !== 'undefined') {
    global.LevelTestplay = LevelTestplay;
    global.TestPlayer = TestPlayer;
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelTestplay, TestPlayer };
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.LevelTestplay = LevelTestplay;
    window.TestPlayer = TestPlayer;
}