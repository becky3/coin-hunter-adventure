/**
 * コインハンターアドベンチャー - 統合版
 * モジュール化されたコードを単一ファイルに統合
 */

// 設定は config.js から読み込み、レベルデータは levels.js から読み込み
if (typeof CANVAS_WIDTH !== 'undefined') {
    console.log('game.js loaded, CANVAS_WIDTH:', CANVAS_WIDTH);
}
if (typeof levelData !== 'undefined' && levelData.platforms) {
    console.log('game.js loaded, levelData platforms count:', levelData.platforms.length);
}

// ===== SVGグラフィックシステム =====
class SVGGraphics {
    constructor(ctx) {
        this.ctx = ctx;
        this.cache = new Map(); // パスキャッシュ
    }
    
    // SVGパスを描画する汎用メソッド
    drawSVGPath(pathData, x, y, width, height, fillStyle = '#000', strokeStyle = null, strokeWidth = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const path = new Path2D(pathData);
        
        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill(path);
        }
        
        if (strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke(path);
        }
        
        this.ctx.restore();
    }
    
    // プレイヤーキャラクターのSVG
    drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame) {
        // HP状態による色とサイズの調整（ネオンカラー）
        let fillColor = health === 2 ? '#00FF88' : '#FF6B35'; // サイバーパンク調
        let glowColor = health === 2 ? '#00FF88' : '#FF6B35';
        let scale = health === 2 ? 1.0 : 0.7;
        let actualWidth = width * scale;
        let actualHeight = height * scale;
        let offsetY = health === 1 ? height * 0.3 : 0;
        
        this.ctx.save();
        
        // 無敵時間中の透明度
        if (invulnerable) {
            this.ctx.globalAlpha = 0.5;
        }
        
        // 向きによる反転
        this.ctx.translate(x + width / 2, y + offsetY);
        if (direction < 0) {
            this.ctx.scale(-1, 1);
        }
        this.ctx.translate(-actualWidth / 2, 0);
        
        // プレイヤーボディ（丸みを帯びた矩形）
        this.ctx.fillStyle = fillColor;
        
        // グロー効果を追加
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.roundRect(5, 5, actualWidth - 10, actualHeight - 10, 8);
        this.ctx.fill();
        
        // グロー効果をリセット
        this.ctx.shadowBlur = 0;
        
        // 帽子（ネオンカラー）
        this.ctx.fillStyle = '#FF3366';
        this.ctx.shadowColor = '#FF3366';
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(actualWidth * 0.1, 0, actualWidth * 0.8, actualHeight * 0.25);
        
        // 帽子のつば
        this.ctx.fillStyle = '#CC1144';
        this.ctx.shadowBlur = 5;
        this.ctx.fillRect(0, actualHeight * 0.2, actualWidth, actualHeight * 0.1);
        
        this.ctx.shadowBlur = 0;
        
        // 目
        this.ctx.fillStyle = 'white';
        const eyeSize = Math.max(3, actualWidth * 0.12);
        const eyeY = actualHeight * 0.4;
        this.ctx.fillRect(actualWidth * 0.25 - eyeSize/2, eyeY, eyeSize, eyeSize);
        this.ctx.fillRect(actualWidth * 0.75 - eyeSize/2, eyeY, eyeSize, eyeSize);
        
        // 瞳
        this.ctx.fillStyle = 'black';
        const pupilSize = eyeSize * 0.6;
        this.ctx.fillRect(actualWidth * 0.25 - pupilSize/2, eyeY + eyeSize * 0.2, pupilSize, pupilSize);
        this.ctx.fillRect(actualWidth * 0.75 - pupilSize/2, eyeY + eyeSize * 0.2, pupilSize, pupilSize);
        
        this.ctx.restore();
    }
    
    // スライムのSVG
    drawSlime(x, y, width, height, animTimer) {
        const bounce = Math.sin(animTimer * 0.1) * 2;
        
        this.ctx.save();
        this.ctx.translate(x, y + bounce);
        
        // スライムボディ（楕円形・ネオンカラー）
        this.ctx.fillStyle = '#00FFAA';
        this.ctx.shadowColor = '#00FFAA';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.ellipse(width / 2, height * 0.7, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // スライムの頭部
        this.ctx.beginPath();
        this.ctx.ellipse(width / 2, height * 0.4, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 輪郭
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.ellipse(width / 2, height * 0.7, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.ellipse(width / 2, height * 0.4, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 目
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.35, height * 0.35, width * 0.08, 0, Math.PI * 2);
        this.ctx.arc(width * 0.65, height * 0.35, width * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 瞳
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.35, height * 0.38, width * 0.04, 0, Math.PI * 2);
        this.ctx.arc(width * 0.65, height * 0.38, width * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 鳥のSVG
    drawBird(x, y, width, height, animTimer) {
        const wingFlap = Math.sin(animTimer * 0.3) * 0.2;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // 鳥のボディ（ネオンパープル）
        this.ctx.fillStyle = '#CC00FF';
        this.ctx.shadowColor = '#CC00FF';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.5, height * 0.6, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 頭
        this.ctx.beginPath();
        this.ctx.arc(width * 0.3, height * 0.4, width * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // くちばし
        this.ctx.fillStyle = '#FF9800';
        this.ctx.beginPath();
        this.ctx.moveTo(width * 0.1, height * 0.4);
        this.ctx.lineTo(width * 0.25, height * 0.35);
        this.ctx.lineTo(width * 0.25, height * 0.45);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 翼（アニメーション）
        this.ctx.fillStyle = '#7B1FA2';
        this.ctx.save();
        this.ctx.translate(width * 0.5, height * 0.5);
        this.ctx.rotate(wingFlap);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width * 0.25, height * 0.15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 目
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.25, height * 0.35, width * 0.05, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.27, height * 0.35, width * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // コインのSVG
    drawCoin(x, y, width, height, rotation) {
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.scale(Math.cos(rotation), 1); // 回転効果
        
        // コインベース（ネオンゴールド）
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.shadowColor = '#FFFF00';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // コインの縁
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 8;
        this.ctx.stroke();
        
        // 中央の記号
        this.ctx.fillStyle = '#FF8800';
        this.ctx.shadowColor = '#FF8800';
        this.ctx.shadowBlur = 6;
        this.ctx.font = `bold ${Math.max(12, width * 0.6)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('¥', 0, 0);
        
        this.ctx.restore();
    }
    
    // フラグのSVG
    drawFlag(x, y, width, height) {
        // ポール
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + width * 0.47, y, width * 0.06, height);
        
        // 旗
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.5, y);
        this.ctx.lineTo(x + width * 0.9, y + height * 0.1);
        this.ctx.lineTo(x + width * 0.85, y + height * 0.25);
        this.ctx.lineTo(x + width * 0.9, y + height * 0.4);
        this.ctx.lineTo(x + width * 0.5, y + height * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 旗の縁
        this.ctx.strokeStyle = '#CC0000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    // スプリングのSVG
    drawSpring(x, y, width, height, compression = 0) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // スプリングベース
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(width * 0.2, height * 0.9, width * 0.6, height * 0.1);
        
        // スプリングコイル（圧縮アニメーション付き）
        const coilHeight = height * 0.8 * (1 - compression * 0.5);
        const coilY = height * 0.1 + compression * height * 0.4;
        const coils = 5;
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 10;
        
        for (let i = 0; i < coils; i++) {
            const segmentHeight = coilHeight / coils;
            const y1 = coilY + i * segmentHeight;
            const y2 = coilY + (i + 0.5) * segmentHeight;
            const y3 = coilY + (i + 1) * segmentHeight;
            
            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.3, y1);
            this.ctx.quadraticCurveTo(width * 0.1, y2, width * 0.3, y3);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(width * 0.7, y1);
            this.ctx.quadraticCurveTo(width * 0.9, y2, width * 0.7, y3);
            this.ctx.stroke();
        }
        
        // トッププレート
        this.ctx.fillStyle = '#FF4444';
        this.ctx.shadowColor = '#FF4444';
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(width * 0.15, coilY - height * 0.05, width * 0.7, height * 0.05);
        
        this.ctx.restore();
    }
}

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
        // 死亡状態では入力を無効化
        if (this.isDead) {
            this.velX = 0;
            return;
        }
        
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
            
            // ジャンプ効果音を再生（ゲームインスタンスを参照）
            if (window.game && window.game.musicSystem && window.game.musicSystem.isInitialized) {
                window.game.musicSystem.playJumpSound();
            }
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


// ===== ゲームメイン =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            throw new Error('gameCanvasが見つかりません');
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.svg = new SVGGraphics(this.ctx); // SVGグラフィックシステム追加
        
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        this.player = new Player();
        
        // モダンデザイン用の時間とエフェクト
        this.gameTime = 0;
        this.particles = [];
        this.backgroundAnimation = 0;
        
        this.camera = { x: 0, y: 0 };
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.flag = null;
        
        this.lastTime = 0;
        this.isRunning = false;
        this.damageEffect = 0; // ダメージエフェクト用
        
        // 音楽システム
        this.musicSystem = new MusicSystem();
        
        this.initLevel();
        this.setupUI();
        this.setupCanvas();
        this.setupResizeHandler();
        this.start();
    }
    
    setupCanvas() {
        // ビューポートサイズに基づいてキャンバスサイズを調整
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        // ゲームエリアが非表示の場合はスキップ
        if (gameArea.style.display === 'none') return;
        
        const rect = gameArea.getBoundingClientRect();
        // rectのサイズが0の場合はスキップ
        if (rect.width === 0 || rect.height === 0) return;
        
        const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
        
        let width = rect.width;
        let height = rect.height;
        
        // アスペクト比を維持
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        // キャンバスの内部解像度は元のまま
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        
        // CSSでの表示サイズを調整
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }
    
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
            }, 100);
        });
    }
    
    initLevel() {
        this.platforms = levelData.platforms;
        this.enemies = levelData.enemies.map(e => ({
            ...e,
            ...ENEMY_CONFIG[e.type],
            velX: ENEMY_CONFIG[e.type].speed,
            direction: 1,
            animTimer: 0,
            originalX: e.x,
            originalY: e.y
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
        
        // スプリングの初期化
        this.springs = (levelData.springs || []).map(s => ({
            ...s,
            ...SPRING_CONFIG,
            compression: 0,
            triggered: false,
            cooldown: 0
        }));
    }
    
    setupUI() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                console.log('スタートボタンがクリックされました');
                
                // ボタンクリック効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playButtonClickSound();
                }
                
                // 音楽システムを初期化（ゲーム開始時のみ）
                if (!this.musicSystem.isInitialized) {
                    try {
                        await this.musicSystem.init();
                        console.log('ゲーム開始時に音楽システムを初期化しました');
                    } catch (e) {
                        console.error('音楽システム初期化失敗:', e);
                    }
                }
                this.startGame();
            });
        }
        
        const restartBtns = document.querySelectorAll('#restartBtn1, #restartBtn2');
        restartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // ボタンクリック効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playButtonClickSound();
                }
                this.restartGame();
            });
        });
        
        const backBtns = document.querySelectorAll('#backToTitleBtn1, #backToTitleBtn2');
        backBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // ボタンクリック効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playButtonClickSound();
                }
                this.backToTitle();
            });
        });
        
        this.updateUIVisibility();
        
        // タイトル画面では音楽を再生しない
        
        // 音量スライダーの設定（ゲーム中）
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.musicSystem.setVolume(volume);
            });
        }
        
        // ミュートボタンの設定（ゲーム中）
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                // ボタンクリック効果音を再生（ミュート中でなければ）
                if (this.musicSystem.isInitialized && !this.musicSystem.getMuteState()) {
                    this.musicSystem.playButtonClickSound();
                }
                
                const isMuted = this.musicSystem.toggleMute();
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                muteBtn.classList.toggle('muted', isMuted);
            });
        }
        
    }
    
    
    startGame() {
        console.log('ゲームを開始します');
        
        // ゲームスタート効果音を再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playGameStartSound();
        }
        
        // ゲームデータをリセット（状態は変更しない）
        this.gameState.resetGameData();
        this.gameState.setState('playing');
        this.player.reset();
        this.resetLevel();
        this.updateUIVisibility();
        
        // ゲームBGMを再生（少し遅延を入れて確実に切り替え）
        if (this.musicSystem.isInitialized) {
            setTimeout(() => {
                this.musicSystem.playGameBGM();
            }, 600); // ゲームスタート効果音の後に再生
        }
    }
    
    restartGame() {
        this.startGame();
    }
    
    backToTitle() {
        console.log('タイトルに戻ります');
        this.gameState.setState('start');
        this.updateUIVisibility();
        
        // タイトル画面では音楽を停止
        if (this.musicSystem.isInitialized) {
            this.musicSystem.stopBGM();
        }
    }
    
    resetLevel() {
        // コインをリセット
        this.coins.forEach(coin => {
            coin.collected = false;
            coin.rotation = 0;
            coin.floatOffset = 0;
        });
        
        // 敵をリセット（初期状態に復元）
        this.enemies = levelData.enemies.map(e => ({
            ...e,
            ...ENEMY_CONFIG[e.type],
            velX: ENEMY_CONFIG[e.type].speed,
            direction: 1,
            animTimer: 0,
            originalX: e.x,
            originalY: e.y
        }));
        
        // スプリングをリセット
        this.springs = (levelData.springs || []).map(s => ({
            ...s,
            ...SPRING_CONFIG,
            compression: 0,
            triggered: false,
            cooldown: 0
        }));
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
        
        // モダンデザイン用の時間を更新
        this.gameTime += deltaTime;
        
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
        
        // スプリング更新
        this.updateSprings(deltaTime);
        
        // ダメージエフェクトの更新
        if (this.damageEffect > 0) {
            this.damageEffect--;
        }
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
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(this.player.getBounds(), enemy)) {
                    const playerBounds = this.player.getBounds();
                    
                    // 踏みつけ判定：プレイヤーが敵の上から落下している場合
                    if (this.player.velY > 0 && // 下向きに移動中
                        playerBounds.y < enemy.y && // プレイヤーが敵より上にいる
                        playerBounds.y + playerBounds.height < enemy.y + enemy.height * 0.7) { // プレイヤーの足が敵の上部にある
                        
                        console.log('敵を踏みつけました！');
                        
                        // 敵を撃破
                        this.enemies.splice(enemyIndex, 1);
                        
                        // 敵踏みつけ効果音を再生
                        if (this.musicSystem.isInitialized) {
                            this.musicSystem.playEnemyStompSound();
                        }
                        
                        // プレイヤーにバウンス効果
                        this.player.velY = -10;
                        
                        // スコア加算
                        this.gameState.addScore(100);
                        
                        return; // 踏みつけ成功時はダメージを受けない
                    } else {
                        // 通常の衝突（横から当たった場合）
                        console.log('敵との衝突を検出');
                        
                        // ダメージ効果音を再生
                        if (this.musicSystem.isInitialized) {
                            this.musicSystem.playDamageSound();
                        }
                        
                        this.loseLife();
                        return; // 一度の衝突で複数回呼ばれるのを防ぐ
                    }
                }
            });
        }
        
        // コイン収集
        this.coins.forEach(coin => {
            if (!coin.collected && this.checkCollision(this.player.getBounds(), coin)) {
                coin.collected = true;
                
                // コイン収集効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playCoinSound();
                }
                
                this.gameState.collectCoin();
            }
        });
        
        // スプリング判定
        this.springs.forEach(spring => {
            if (spring.cooldown > 0) return;
            
            const springBounds = {
                x: spring.x,
                y: spring.y,
                width: spring.width,
                height: spring.height
            };
            
            if (this.checkCollision(this.player.getBounds(), springBounds)) {
                // プレイヤーが上から接触している場合のみ発動
                if (this.player.velY > 0 && this.player.y < spring.y) {
                    console.log('スプリングに乗りました！');
                    
                    // 大ジャンプ
                    this.player.velY = -spring.bouncePower;
                    this.player.onGround = false;
                    
                    // スプリング発動
                    spring.compression = 1;
                    spring.triggered = true;
                    spring.cooldown = 30; // クールダウン設定
                    
                    // スプリング効果音を再生（実装予定）
                    // if (this.musicSystem.isInitialized) {
                    //     this.musicSystem.playSpringSound();
                    // }
                }
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
                
                // ゴール効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playGoalSound();
                }
                
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
        if (this.player.y > worldHeight && !this.player.isDead) {
            console.log(`プレイヤーが穴に落ちました！ 現在のライフ: ${this.gameState.lives}, HP: ${this.player.health}`);
            this.fallDeath();
        }
        
        // 敵の境界チェックと落下判定
        this.enemies.forEach(enemy => {
            if (enemy.type === 'bird') {
                // 飛行敵（鳥）の境界処理 - 画面端でワープ
                if (enemy.x < -enemy.width) {
                    enemy.x = worldWidth;
                } else if (enemy.x > worldWidth) {
                    enemy.x = -enemy.width;
                }
            } else {
                // 地上敵の境界処理 - 画面端で反転
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
            }
            
            // 敵の落下判定
            if (enemy.y > worldHeight) {
                console.log('敵が穴に落ちました');
                // 敵を初期位置にリセット - 正しい敵を特定するため元のインデックスを使用
                const originalEnemies = levelData.enemies;
                const originalIndex = originalEnemies.findIndex(e => 
                    e.type === enemy.type && e.x === enemy.originalX && e.y === enemy.originalY
                );
                
                if (originalIndex !== -1) {
                    const originalEnemy = originalEnemies[originalIndex];
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
                // 現在立っているプラットフォームを確認
                this.platforms.forEach(platform => {
                    if (enemy.y + enemy.height >= platform.y && 
                        enemy.y + enemy.height <= platform.y + 10 &&
                        enemy.x + enemy.width > platform.x && 
                        enemy.x < platform.x + platform.width) {
                        
                        // プラットフォームの端に近づいたら方向転換（振動防止のため一度だけ実行）
                        if ((enemy.velX > 0 && enemy.x + enemy.width >= platform.x + platform.width - 10) ||
                            (enemy.velX < 0 && enemy.x <= platform.x + 10)) {
                            enemy.velX *= -1;
                            enemy.direction *= -1;
                            
                            // 位置を少し調整して振動を防ぐ
                            if (enemy.velX > 0) {
                                enemy.x = platform.x + 15;
                            } else {
                                enemy.x = platform.x + platform.width - enemy.width - 15;
                            }
                        }
                    }
                });
            } else {
                // 鳥の場合は境界での方向転換は行わない（ワープ処理のみ）
                // updateEnemiesでの横移動は継続
            }
        });
    }
    
    updateSprings(deltaTime) {
        this.springs.forEach(spring => {
            // クールダウン処理
            if (spring.cooldown > 0) {
                spring.cooldown--;
            }
            
            // 圧縮アニメーション
            if (spring.compression > 0) {
                spring.compression -= SPRING_CONFIG.animationSpeed;
                if (spring.compression < 0) {
                    spring.compression = 0;
                    spring.triggered = false;
                }
            }
        });
    }
    
    loseLife() {
        console.log('ダメージを受けました！');
        const isDead = this.player.takeDamage();
        
        // ダメージエフェクト：画面を少し赤くする
        this.damageEffect = 30; // 30フレーム間エフェクト表示
        
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
            console.log(`無敵時間開始 - 残りHP: ${this.player.health}`);
        }
    }
    
    fallDeath() {
        console.log('プレイヤーが穴に落ちて死亡しました！');
        
        // 穴落ち効果音を再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playFallDeathSound();
        }
        
        // プレイヤーを即死状態にする
        this.player.isDead = true;
        this.player.velX = 0;
        this.player.velY = 0;
        
        // ダメージエフェクト
        this.damageEffect = 30;
        
        // ライフを減らす
        const gameOver = this.gameState.loseLife();
        if (gameOver) {
            console.log('ゲームオーバー');
            this.gameOver();
        } else {
            console.log('ライフが残っています。少し待ってからプレイヤーをリセット');
            // 少し遅延を入れてリセット（死亡演出のため）
            setTimeout(() => {
                if (this.gameState.lives > 0) {
                    this.player.reset();
                }
            }, 1000);
        }
    }
    
    levelComplete() {
        this.gameState.setState('levelComplete');
        this.updateUIVisibility();
        
        // 勝利ジングルを再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playVictoryJingle();
        }
    }
    
    gameOver() {
        this.gameState.setState('gameOver');
        this.updateUIVisibility();
        
        // ゲームオーバージングルを再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playGameOverJingle();
        }
    }
    
    render() {
        // 画面クリア
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 背景
        this.drawBackground();
        
        if (this.gameState.state === 'playing' || this.gameState.state === 'levelComplete') {
            // ゲームオブジェクト描画
            this.drawPlatforms();
            this.drawSprings();
            this.drawCoins();
            this.drawEnemies();
            this.drawPlayer();
            this.drawFlag();
        }
        
        // ダメージエフェクト
        if (this.damageEffect > 0) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageEffect / 60})`;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            this.ctx.restore();
        }
    }
    
    drawBackground() {
        // モダンなダイナミックグラデーション背景
        const time = this.gameTime * 0.001; // 時間ベースのアニメーション
        
        // ダークモードベースのグラデーション
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        
        // 時間によって変化する色彩
        const hue1 = 220 + Math.sin(time * 0.5) * 30; // ブルー系ベース
        const hue2 = 280 + Math.cos(time * 0.3) * 40; // パープル系ベース
        
        gradient.addColorStop(0, `hsl(${hue1}, 70%, 15%)`);
        gradient.addColorStop(0.5, `hsl(${(hue1 + hue2) / 2}, 60%, 8%)`);
        gradient.addColorStop(1, `hsl(${hue2}, 80%, 12%)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // 背景パーティクル（星空効果）
        this.drawBackgroundParticles();
    }
    
    drawBackgroundParticles() {
        // 背景用パーティクルを生成
        if (this.particles.length < 100) {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                    size: Math.random() * 2 + 1,
                    speed: Math.random() * 0.5 + 0.2,
                    opacity: Math.random() * 0.8 + 0.2,
                    twinkle: Math.random() * Math.PI * 2,
                    color: Math.random() > 0.7 ? '#FFD700' : '#FFFFFF'
                });
            }
        }
        
        // パーティクルの描画と更新
        this.particles.forEach((particle, index) => {
            // きらめき効果
            particle.twinkle += 0.1;
            const alpha = particle.opacity * (0.5 + 0.5 * Math.sin(particle.twinkle));
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            // グロー効果
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = particle.size * 3;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
            
            // パーティクルの移動
            particle.y -= particle.speed;
            particle.x += Math.sin(this.gameTime * 0.001 + index) * 0.2;
            
            // 画面外に出たら再配置
            if (particle.y < -10) {
                particle.y = CANVAS_HEIGHT + 10;
                particle.x = Math.random() * CANVAS_WIDTH;
            }
        });
    }
    
    drawPlatforms() {
        this.platforms.forEach(platform => {
            const x = platform.x - this.camera.x;
            if (x + platform.width > 0 && x < CANVAS_WIDTH) {
                this.ctx.save();
                
                // モダンなグラデーションプラットフォーム
                const gradient = this.ctx.createLinearGradient(x, platform.y, x, platform.y + platform.height);
                gradient.addColorStop(0, '#4A5568');
                gradient.addColorStop(0.5, '#2D3748');
                gradient.addColorStop(1, '#1A202C');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x, platform.y, platform.width, platform.height);
                
                // 上面のハイライト
                this.ctx.fillStyle = '#63B3ED';
                this.ctx.fillRect(x, platform.y, platform.width, 2);
                
                // グロー効果
                this.ctx.shadowColor = '#63B3ED';
                this.ctx.shadowBlur = 8;
                this.ctx.fillRect(x, platform.y, platform.width, 1);
                
                this.ctx.restore();
            }
        });
    }
    
    drawPlayer() {
        const x = this.player.x - this.camera.x;
        
        // SVGグラフィックでプレイヤーを描画
        this.svg.drawPlayer(
            x, 
            this.player.y, 
            this.player.width, 
            this.player.height, 
            this.player.health, 
            this.player.direction, 
            this.player.invulnerable, 
            this.player.animFrame
        );
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const x = enemy.x - this.camera.x;
            if (x + enemy.width > 0 && x < CANVAS_WIDTH) {
                // 敵の種類に応じてSVG描画
                if (enemy.type === 'slime') {
                    this.svg.drawSlime(x, enemy.y, enemy.width, enemy.height, enemy.animTimer);
                } else if (enemy.type === 'bird') {
                    this.svg.drawBird(x, enemy.y, enemy.width, enemy.height, enemy.animTimer);
                }
            }
        });
    }
    
    drawCoins() {
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const x = coin.x - this.camera.x;
                if (x + coin.width > 0 && x < CANVAS_WIDTH) {
                    // SVGグラフィックでコインを描画
                    this.svg.drawCoin(x, coin.y, coin.width, coin.height, coin.rotation);
                }
            }
        });
    }
    
    drawSprings() {
        this.springs.forEach(spring => {
            const x = spring.x - this.camera.x;
            if (x + spring.width > 0 && x < CANVAS_WIDTH) {
                // SVGグラフィックでスプリングを描画
                this.svg.drawSpring(x, spring.y, spring.width, spring.height, spring.compression);
            }
        });
    }
    
    drawFlag() {
        if (!this.flag) return;
        
        const x = this.flag.x - this.camera.x;
        if (x + 60 > 0 && x < CANVAS_WIDTH) {
            // SVGグラフィックでフラグを描画
            this.svg.drawFlag(x, this.flag.y, 60, 80);
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
        const gameArea = document.querySelector('.game-area');
        const hudTop = document.querySelector('.hud-top');
        
        // 全て非表示
        if (startScreen) startScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        if (gameClearScreen) gameClearScreen.style.display = 'none';
        
        // 対応する画面を表示
        if (this.gameState.state === 'start') {
            if (startScreen) startScreen.style.display = 'flex';
            // スタート画面の時はゲームキャンバスとHUDを非表示
            if (gameArea) gameArea.style.display = 'none';
            if (hudTop) hudTop.style.display = 'none';
        } else if (this.gameState.state === 'gameOver') {
            if (gameOverScreen) gameOverScreen.style.display = 'flex';
            // ゲームオーバー画面の時もゲームキャンバスとHUDを非表示
            if (gameArea) gameArea.style.display = 'none';
            if (hudTop) hudTop.style.display = 'none';
        } else if (this.gameState.state === 'levelComplete') {
            if (gameClearScreen) gameClearScreen.style.display = 'flex';
            // ゲームクリア画面の時もゲームキャンバスとHUDを非表示
            if (gameArea) gameArea.style.display = 'none';
            if (hudTop) hudTop.style.display = 'none';
        } else {
            // ゲーム中はゲームキャンバスとHUDを表示
            if (gameArea) gameArea.style.display = 'flex';
            if (hudTop) hudTop.style.display = 'flex';
            // ゲーム開始時にキャンバスサイズを再計算
            this.setupCanvas();
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

// Node.js環境用にクラスをグローバルに設定
if (typeof global !== 'undefined') {
    global.GameState = GameState;
    global.Player = Player;
    global.InputManager = InputManager;
    global.Game = Game;
}