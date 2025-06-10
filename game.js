/**
 * コインハンターアドベンチャー - 統合版
 * モジュール化されたコードを単一ファイルに統合
 */

// 設定は config.js から読み込み
console.log('game.js loaded, CANVAS_WIDTH:', CANVAS_WIDTH);

// ===== ゲーム状態管理 =====
class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = 'start';
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.level = 1;
        this.time = 300;
        this.gameSpeed = 1;
        this.isPaused = false;
    }
    
    // ゲームプレイ用のリセット（状態は変更しない）
    resetGameData() {
        this.score = 0;
        this.lives = 3;
        this.coins = 0;
        this.level = 1;
        this.time = 300;
        this.gameSpeed = 1;
        this.isPaused = false;
    }

    setState(newState) {
        this.state = newState;
    }

    addScore(points) {
        this.score += points;
    }

    collectCoin() {
        this.coins++;
        this.addScore(10);
    }

    loseLife() {
        this.lives--;
        return this.lives <= 0;
    }

    updateTime(deltaTime) {
        if (this.state === 'playing' && !this.isPaused) {
            this.time -= deltaTime;
            if (this.time <= 0) {
                this.time = 0;
                return true;
            }
        }
        return false;
    }

    isPlaying() {
        return this.state === 'playing' && !this.isPaused;
    }
}

// ===== プレイヤークラス =====
class Player {
    constructor(x, y) {
        this.x = x || PLAYER_CONFIG.spawnX;
        this.y = y || PLAYER_CONFIG.spawnY;
        this.width = PLAYER_CONFIG.width;
        this.height = PLAYER_CONFIG.height;
        
        this.velX = 0;
        this.velY = 0;
        this.speed = PLAYER_CONFIG.speed;
        this.jumpPower = PLAYER_CONFIG.jumpPower;
        this.direction = 1;
        
        this.onGround = false;
        this.isJumping = false;
        this.isDead = false;
        
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        this.animTimer = 0;
        this.animFrame = 0;
        this.health = PLAYER_CONFIG.maxHealth;
    }
    
    update(input, deltaTime) {
        this.handleInput(input);
        
        this.velY += GRAVITY;
        this.velY = Math.min(this.velY, 20);
        
        this.x += this.velX;
        this.y += this.velY;
        
        if (this.invulnerable) {
            this.invulnerabilityTime--;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        this.updateAnimation();
    }
    
    handleInput(input) {
        // 左右移動のリセット
        this.velX = 0;
        
        if (input.left) {
            this.velX = -this.speed;
            this.direction = -1;
        } else if (input.right) {
            this.velX = this.speed;
            this.direction = 1;
        }
        
        if (input.jump && this.onGround && !this.isJumping) {
            this.velY = -this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
        }
        
        if (!input.jump) {
            this.isJumping = false;
        }
    }
    
    updateAnimation() {
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
    }
    
    handleGroundCollision(groundY) {
        // 地面衝突判定を無効化 - プラットフォーム判定のみ使用
        // if (this.y + this.height > groundY) {
        //     this.y = groundY - this.height;
        //     this.velY = 0;
        //     this.onGround = true;
        // }
    }
    
    takeDamage() {
        if (this.invulnerable) {
            console.log('無敵時間中のため、ダメージ無効');
            return false;
        }
        
        this.health--;
        this.invulnerable = true;
        this.invulnerabilityTime = PLAYER_CONFIG.invulnerabilityTime;
        
        console.log('ダメージを受けました。残りヘルス:', this.health);
        
        if (this.health <= 0) {
            this.isDead = true;
            console.log('プレイヤー死亡');
            return true;
        }
        
        return false;
    }
    
    reset() {
        this.x = PLAYER_CONFIG.spawnX;
        this.y = PLAYER_CONFIG.spawnY;
        this.velX = 0;
        this.velY = 0;
        this.health = PLAYER_CONFIG.maxHealth;
        this.isDead = false;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.onGround = false;
        this.isJumping = false;
        this.direction = 1;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// ===== 入力管理 =====
class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
            this.previousKeys = {};
        });
    }

    getInputState() {
        return {
            left: this.keys['ArrowLeft'] || this.keys['KeyA'],
            right: this.keys['ArrowRight'] || this.keys['KeyD'],
            jump: this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp'],
            pause: this.keys['Escape'] || this.keys['KeyP']
        };
    }

    isKeyPressed(key) {
        return this.keys[key];
    }

    isKeyJustPressed(key) {
        return this.keys[key] && !this.previousKeys[key];
    }

    update() {
        this.previousKeys = { ...this.keys };
    }
}

// ===== 簡単なレベルデータ =====
const levelData = {
    platforms: [
        // 地面レベル - 隙間を広くする
        { x: 0, y: 476, width: 600, height: 100 },      // 最初の地面
        { x: 750, y: 476, width: 300, height: 100 },    // 隙間: 600-750 (150px)
        { x: 1150, y: 476, width: 400, height: 100 },   // 隙間: 1050-1150 (100px)
        { x: 1650, y: 476, width: 350, height: 100 },   // 隙間: 1550-1650 (100px)
        { x: 2100, y: 476, width: 400, height: 100 },   // 隙間: 2000-2100 (100px)
        { x: 2600, y: 476, width: 400, height: 100 },   // 隙間: 2500-2600 (100px)
        
        // 空中のプラットフォーム - 配置を調整
        { x: 200, y: 350, width: 150, height: 20 },
        { x: 400, y: 250, width: 150, height: 20 },
        { x: 650, y: 350, width: 100, height: 20 },
        { x: 850, y: 300, width: 120, height: 20 },
        { x: 1200, y: 350, width: 200, height: 20 },
        { x: 1450, y: 250, width: 150, height: 20 },
        { x: 1700, y: 350, width: 100, height: 20 },
        { x: 2000, y: 300, width: 150, height: 20 },
        { x: 2300, y: 200, width: 200, height: 20 }
    ],
    enemies: [
        { type: 'slime', x: 550, y: 436 },  // 最初の地面の端付近
        { type: 'slime', x: 900, y: 436 },  // 2番目の地面の端付近
        { type: 'slime', x: 1400, y: 436 }, // 3番目の地面の端付近
        { type: 'slime', x: 1950, y: 436 }, // 4番目の地面の端付近
        { type: 'slime', x: 2400, y: 436 }  // 5番目の地面の端付近
    ],
    coins: [
        // 地面のコイン
        { x: 150, y: 440 },
        { x: 350, y: 440 },
        { x: 500, y: 440 },
        { x: 800, y: 440 },
        { x: 950, y: 440 },
        { x: 1200, y: 440 },
        { x: 1400, y: 440 },
        { x: 1700, y: 440 },
        { x: 1900, y: 440 },
        { x: 2200, y: 440 },
        { x: 2450, y: 440 },
        { x: 2700, y: 440 },
        
        // 空中のコイン
        { x: 225, y: 320 },
        { x: 425, y: 220 },
        { x: 675, y: 320 },
        { x: 875, y: 270 },
        { x: 1250, y: 320 },
        { x: 1300, y: 320 },
        { x: 1475, y: 220 },
        { x: 1725, y: 320 },
        { x: 2025, y: 270 },
        { x: 2350, y: 170 },
        { x: 2400, y: 170 }
    ],
    flag: { x: 2800, y: 396 }
};

// ===== ゲームメイン =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            throw new Error('gameCanvasが見つかりません');
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        this.player = new Player();
        
        this.camera = { x: 0, y: 0 };
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.flag = null;
        
        this.lastTime = 0;
        this.isRunning = false;
        
        this.initLevel();
        this.setupUI();
        this.start();
    }
    
    initLevel() {
        this.platforms = levelData.platforms;
        this.enemies = levelData.enemies.map(e => ({
            ...e,
            ...ENEMY_CONFIG[e.type],
            velX: ENEMY_CONFIG[e.type].speed,
            direction: 1,
            animTimer: 0
        }));
        this.coins = levelData.coins.map(c => ({
            ...c,
            ...COIN_CONFIG,
            collected: false,
            rotation: 0,
            floatOffset: 0,
            baseY: c.y
        }));
        this.flag = levelData.flag;
    }
    
    setupUI() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }
        
        const restartBtns = document.querySelectorAll('#restartBtn1, #restartBtn2');
        restartBtns.forEach(btn => {
            btn.addEventListener('click', () => this.restartGame());
        });
        
        const backBtns = document.querySelectorAll('#backToTitleBtn1, #backToTitleBtn2');
        backBtns.forEach(btn => {
            btn.addEventListener('click', () => this.backToTitle());
        });
        
        this.updateUIVisibility();
    }
    
    startGame() {
        // ゲームデータをリセット（状態は変更しない）
        this.gameState.resetGameData();
        this.gameState.setState('playing');
        this.player.reset();
        this.resetLevel();
        this.updateUIVisibility();
    }
    
    restartGame() {
        this.startGame();
    }
    
    backToTitle() {
        this.gameState.setState('start');
        this.updateUIVisibility();
    }
    
    resetLevel() {
        this.coins.forEach(coin => {
            coin.collected = false;
            coin.rotation = 0;
            coin.floatOffset = 0;
        });
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.gameState.isPlaying()) {
            this.update(deltaTime);
        }
        
        this.render();
        this.updateUI();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        const input = this.inputManager.getInputState();
        
        if (!this.gameState.isPlaying()) return;
        
        // 入力状態を更新
        this.inputManager.update();
        
        // タイマー更新
        const timeUp = this.gameState.updateTime(deltaTime);
        if (timeUp) {
            this.gameOver();
            return;
        }
        
        // プレイヤー更新
        this.player.update(input, deltaTime);
        
        // 衝突判定
        this.handleCollisions();
        
        // カメラ更新
        this.updateCamera();
        
        // 境界チェック
        this.checkBoundaries();
        
        // コイン更新
        this.updateCoins(deltaTime);
        
        // 敵更新
        this.updateEnemies(deltaTime);
    }
    
    handleCollisions() {
        // プラットフォーム衝突
        let onPlatform = false;
        this.platforms.forEach(platform => {
            const playerBounds = this.player.getBounds();
            
            if (this.checkCollision(playerBounds, platform)) {
                // 上から衝突（着地）
                if (this.player.velY > 0 && 
                    playerBounds.y < platform.y && 
                    playerBounds.y + playerBounds.height > platform.y) {
                    this.player.y = platform.y - playerBounds.height;
                    this.player.velY = 0;
                    onPlatform = true;
                }
                // 下から衝突
                else if (this.player.velY < 0 && 
                         playerBounds.y > platform.y) {
                    this.player.y = platform.y + platform.height;
                    this.player.velY = 0;
                }
                // 横から衝突
                else if (playerBounds.x < platform.x && this.player.velX > 0) {
                    this.player.x = platform.x - playerBounds.width;
                    this.player.velX = 0;
                }
                else if (playerBounds.x > platform.x && this.player.velX < 0) {
                    this.player.x = platform.x + platform.width;
                    this.player.velX = 0;
                }
            }
        });
        
        // プラットフォームに立っているかチェック（地面判定は削除）
        this.player.onGround = onPlatform;
        
        // 敵との衝突
        if (!this.player.invulnerable) {
            this.enemies.forEach(enemy => {
                if (this.checkCollision(this.player.getBounds(), enemy)) {
                    console.log('敵との衝突を検出');
                    this.loseLife();
                    return; // 一度の衝突で複数回呼ばれるのを防ぐ
                }
            });
        }
        
        // コイン収集
        this.coins.forEach(coin => {
            if (!coin.collected && this.checkCollision(this.player.getBounds(), coin)) {
                coin.collected = true;
                this.gameState.collectCoin();
            }
        });
        
        // ゴール判定
        if (this.flag) {
            const flagBounds = {
                x: this.flag.x,
                y: this.flag.y,
                width: 60,
                height: 80
            };
            
            if (this.checkCollision(this.player.getBounds(), flagBounds)) {
                console.log('ゴールに到達！');
                this.levelComplete();
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateCamera() {
        const targetX = this.player.x - CANVAS_WIDTH / 2;
        this.camera.x = Math.max(0, Math.min(targetX, 3000 - CANVAS_WIDTH));
    }
    
    checkBoundaries() {
        const worldWidth = 3000;
        const worldHeight = CANVAS_HEIGHT;
        
        // プレイヤーの境界チェック
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velX = 0;
        }
        if (this.player.x + this.player.width > worldWidth) {
            this.player.x = worldWidth - this.player.width;
            this.player.velX = 0;
        }
        
        // 落下死判定
        if (this.player.y > worldHeight) {
            console.log('プレイヤーが穴に落ちました');
            this.loseLife();
            this.player.reset();
        }
        
        // 敵の境界チェックと落下判定
        this.enemies.forEach(enemy => {
            if (enemy.x < 0) {
                enemy.x = 0;
                enemy.velX *= -1;
                enemy.direction *= -1;
            }
            if (enemy.x + enemy.width > worldWidth) {
                enemy.x = worldWidth - enemy.width;
                enemy.velX *= -1;
                enemy.direction *= -1;
            }
            
            // 敵の落下判定
            if (enemy.y > worldHeight) {
                console.log('敵が穴に落ちました');
                // 敵を初期位置にリセット
                const originalEnemy = levelData.enemies.find(e => e.type === enemy.type);
                if (originalEnemy) {
                    enemy.x = originalEnemy.x;
                    enemy.y = originalEnemy.y;
                    enemy.velY = 0;
                }
            }
        });
    }
    
    updateCoins(deltaTime) {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                coin.rotation += coin.rotationSpeed;
                coin.floatOffset += 0.05;
                coin.y = coin.baseY + Math.sin(coin.floatOffset) * 5;
            }
        });
    }
    
    updateEnemies(deltaTime) {
        this.enemies.forEach(enemy => {
            enemy.animTimer++;
            
            // 重力を適用（鳥以外）
            if (enemy.type !== 'bird') {
                if (!enemy.velY) enemy.velY = 0;
                enemy.velY += GRAVITY;
                enemy.velY = Math.min(enemy.velY, 20);
                enemy.y += enemy.velY;
                
                // プラットフォーム衝突のみ（地面衝突は削除）
                this.platforms.forEach(platform => {
                    if (this.checkCollision(enemy, platform)) {
                        if (enemy.velY > 0 && enemy.y < platform.y) {
                            enemy.y = platform.y - enemy.height;
                            enemy.velY = 0;
                        }
                    }
                });
            }
            
            // 横移動
            enemy.x += enemy.velX;
            
            // プラットフォームの端での方向転換
            if (enemy.type !== 'bird') {
                let onPlatform = false;
                
                // 現在立っているプラットフォームを確認
                this.platforms.forEach(platform => {
                    if (enemy.y + enemy.height >= platform.y && 
                        enemy.y + enemy.height <= platform.y + 10 &&
                        enemy.x + enemy.width > platform.x && 
                        enemy.x < platform.x + platform.width) {
                        onPlatform = true;
                        
                        // プラットフォームの端に近づいたら方向転換
                        if (enemy.x <= platform.x + 5 || 
                            enemy.x + enemy.width >= platform.x + platform.width - 5) {
                            enemy.velX *= -1;
                            enemy.direction *= -1;
                        }
                    }
                });
                
                // プラットフォーム上にいない場合は落下させる
                // 地面判定を削除したので、ここでの方向転換も削除
            } else {
                // 鳥の場合の簡易的な方向転換
                if (enemy.x < 0 || enemy.x > 3000) {
                    enemy.velX *= -1;
                    enemy.direction *= -1;
                }
            }
        });
    }
    
    loseLife() {
        console.log('敵に衝突！ライフを失います');
        const isDead = this.player.takeDamage();
        
        if (isDead) {
            const gameOver = this.gameState.loseLife();
            if (gameOver) {
                console.log('ゲームオーバー');
                this.gameOver();
            } else {
                console.log('ライフが残っています。プレイヤーをリセット');
                this.player.reset();
            }
        } else {
            console.log('無敵時間開始');
        }
    }
    
    levelComplete() {
        this.gameState.setState('levelComplete');
        this.updateUIVisibility();
    }
    
    gameOver() {
        this.gameState.setState('gameOver');
        this.updateUIVisibility();
    }
    
    render() {
        // 画面クリア
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 背景
        this.drawBackground();
        
        if (this.gameState.state === 'playing' || this.gameState.state === 'levelComplete') {
            // ゲームオブジェクト描画
            this.drawPlatforms();
            this.drawCoins();
            this.drawEnemies();
            this.drawPlayer();
            this.drawFlag();
        }
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#F0E68C');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    drawPlatforms() {
        this.ctx.fillStyle = COLORS.platform;
        this.platforms.forEach(platform => {
            const x = platform.x - this.camera.x;
            if (x + platform.width > 0 && x < CANVAS_WIDTH) {
                this.ctx.fillRect(x, platform.y, platform.width, platform.height);
            }
        });
    }
    
    drawPlayer() {
        const x = this.player.x - this.camera.x;
        
        this.ctx.save();
        
        if (this.player.invulnerable && Math.floor(this.player.invulnerabilityTime / 5) % 2) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // デバッグ用：プレイヤーの境界ボックスを表示
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.strokeRect(x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.fillStyle = COLORS.player;
        this.ctx.fillRect(x, this.player.y, this.player.width, this.player.height);
        
        this.ctx.restore();
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const x = enemy.x - this.camera.x;
            if (x + enemy.width > 0 && x < CANVAS_WIDTH) {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(x, enemy.y, enemy.width, enemy.height);
            }
        });
    }
    
    drawCoins() {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const x = coin.x - this.camera.x;
                if (x + coin.width > 0 && x < CANVAS_WIDTH) {
                    this.ctx.save();
                    this.ctx.translate(x + coin.width / 2, coin.y + coin.height / 2);
                    this.ctx.scale(Math.cos(coin.rotation), 1);
                    this.ctx.fillStyle = COLORS.coin;
                    this.ctx.fillRect(-coin.width / 2, -coin.height / 2, coin.width, coin.height);
                    this.ctx.restore();
                }
            }
        });
    }
    
    drawFlag() {
        if (!this.flag) return;
        
        const x = this.flag.x - this.camera.x;
        if (x + 60 > 0 && x < CANVAS_WIDTH) {
            // デバッグ用：フラグの境界ボックスを表示
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.strokeRect(x, this.flag.y, 60, 80);
            
            // ポール
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + 28, this.flag.y, 4, 80);
            
            // 旗
            this.ctx.fillStyle = COLORS.flag;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 30, this.flag.y);
            this.ctx.lineTo(x + 70, this.flag.y + 20);
            this.ctx.lineTo(x + 30, this.flag.y + 40);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    updateUI() {
        // HTML UI要素を更新
        const scoreElement = document.getElementById('score');
        if (scoreElement) scoreElement.textContent = this.gameState.score;
        
        const livesElement = document.getElementById('lives');
        if (livesElement) livesElement.textContent = this.gameState.lives;
        
        const coinsElement = document.getElementById('coins');
        if (coinsElement) coinsElement.textContent = this.gameState.coins;
        
        const finalScoreElement = document.getElementById('finalScore');
        if (finalScoreElement) finalScoreElement.textContent = this.gameState.score;
        
        const clearScoreElement = document.getElementById('clearScore');
        if (clearScoreElement) clearScoreElement.textContent = this.gameState.score;
    }
    
    updateUIVisibility() {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameClearScreen = document.getElementById('gameClearScreen');
        
        // 全て非表示
        if (startScreen) startScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        if (gameClearScreen) gameClearScreen.style.display = 'none';
        
        // 対応する画面を表示
        if (this.gameState.state === 'start') {
            if (startScreen) startScreen.style.display = 'flex';
        } else if (this.gameState.state === 'gameOver') {
            if (gameOverScreen) gameOverScreen.style.display = 'flex';
        } else if (this.gameState.state === 'levelComplete') {
            if (gameClearScreen) gameClearScreen.style.display = 'flex';
        }
    }
}

// ===== ゲーム開始 =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        const game = new Game();
        
        // グローバルにアクセス可能にする（デバッグ用）
        window.game = game;
        
        // テスト用関数
        window.testStart = function() {
            if (window.game) {
                window.game.startGame();
            }
        };
        
    } catch (error) {
        console.error('ゲーム初期化エラー:', error);
    }
});