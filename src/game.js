/**
 * コインハンターアドベンチャー - メインゲームクラス
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        
        if (!this.canvas) {
            throw new Error('gameCanvasが見つかりません');
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.svg = new SVGGraphics(this.ctx);
        
        this.gameState = new GameState();
        this.inputManager = new InputManager();
        this.player = new Player();
        
        // LevelLoaderの初期化（必須）
        if (typeof LevelLoader === 'undefined') {
            throw new Error('LevelLoaderクラスが読み込まれていません。level-loader.jsが正しく読み込まれているか確認してください。');
        }
        
        this.levelLoader = new LevelLoader();
        
        // モダンデザイン用の時間とエフェクト
        this.gameTime = 0;
        this.particles = [];
        this.backgroundAnimation = 0;
        this.scoreAnimations = [];
        
        // デバッグ表示制御
        this.showJumpDebug = false;
        
        this.camera = { x: 0, y: 0 };
        this.platforms = [];
        this.enemies = [];
        this.coins = [];
        this.flag = null;
        this.springs = [];
        
        this.lastTime = 0;
        this.isRunning = false;
        this.damageEffect = 0;
        
        // 音楽システム
        this.musicSystem = new MusicSystem();
        
        // 初期化フラグ
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            // ステージデータの初期化
            await this.initializeStageData();
            
            // ステージデータ読み込み後にレベル初期化
            this.initLevel();
            this.setupUI();
            this.setupCanvas();
            this.setupResizeHandler();
            
            // SVGファイルの事前読み込み
            await this.preloadSVGs();
            
            this.isInitialized = true;
            
            // Node.js環境ではゲームを自動開始しない
            if (typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
                this.start();
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    async initializeStageData() {
        try {
            // ステージリストを読み込み
            await this.levelLoader.loadStageList();
            
            // 進行状況を読み込み
            this.levelLoader.loadProgress();
            
            // 現在のステージまたはstage1を読み込み
            const currentStage = this.levelLoader.stageList?.currentStage || 'stage1';
            
            this.currentStageData = await this.levelLoader.loadStage(currentStage);
            
        } catch (error) {
            throw new Error(`ステージデータの初期化に失敗しました: ${error.message}`);
        }
    }
    
    setupCanvas() {
        // Node.js環境ではキャンバスセットアップをスキップ
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        
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
        // 現在のステージデータを使用
        if (!this.currentStageData) {
            throw new Error('ステージデータが読み込まれていません。LevelLoaderでステージを読み込んでください。');
        }
        
        this.loadLevelFromJSON(this.currentStageData);
    }
    
    loadLevelFromJSON(stageData) {
        this.platforms = stageData.platforms || [];
        
        this.enemies = (stageData.enemies || []).map(e => ({
            ...e,
            ...ENEMY_CONFIG[e.type],
            velX: e.type === 'bird' ? -ENEMY_CONFIG[e.type].speed : ENEMY_CONFIG[e.type].speed,
            direction: e.type === 'bird' ? -1 : 1,
            animTimer: 0,
            originalX: e.x,
            originalY: e.y
        }));
        
        this.coins = (stageData.coins || []).map(c => ({
            ...c,
            ...COIN_CONFIG,
            collected: false,
            rotation: 0,
            floatOffset: 0,
            baseY: c.y
        }));
        
        this.flag = stageData.goal || { x: 2900, y: 396 };
        
        // スプリングの初期化
        this.springs = (stageData.springs || []).map(s => ({
            ...s,
            ...SPRING_CONFIG,
            compression: 0,
            triggered: false,
            cooldown: 0
        }));
        
        // プレイヤーの初期位置を設定
        if (stageData.playerSpawn) {
            this.player.x = stageData.playerSpawn.x;
            this.player.y = stageData.playerSpawn.y;
        }
    }
    
    setupUI() {
        // Node.js環境ではUIセットアップをスキップ
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        
        const startBtn = document.getElementById('startBtn');
        if (startBtn && typeof startBtn.addEventListener === 'function') {
            startBtn.addEventListener('click', async () => {
                // ボタンクリック効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playButtonClickSound();
                }
                
                // 音楽システムを初期化（ゲーム開始時のみ）
                if (!this.musicSystem.isInitialized) {
                    try {
                        await this.musicSystem.init();
                    } catch (e) {
                        // 音楽初期化エラーは無視
                    }
                }
                await this.startGame();
            });
        }
        
        const restartBtns = document.querySelectorAll('#restartBtn1, #restartBtn2');
        restartBtns.forEach(btn => {
            if (btn && typeof btn.addEventListener === 'function') {
                btn.addEventListener('click', () => {
                    // リスタート効果音を再生
                    if (this.musicSystem.isInitialized) {
                        this.musicSystem.playRestartSound();
                    }
                    this.restartGame();
                });
            }
        });
        
        const titleBtns = document.querySelectorAll('#titleBtn1, #titleBtn2');
        titleBtns.forEach(btn => {
            if (btn && typeof btn.addEventListener === 'function') {
                btn.addEventListener('click', () => {
                    // ボタンクリック効果音を再生
                    if (this.musicSystem.isInitialized) {
                        this.musicSystem.playButtonClickSound();
                    }
                    this.backToTitle();
                });
            }
        });
        
        // 音楽ミュートボタン
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn && typeof muteBtn.addEventListener === 'function') {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.musicSystem.toggleMute();
                muteBtn.classList.toggle('muted', isMuted);
            });
        }
    }
    
    async startGame() {
        // ゲームスタート効果音を再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playGameStartSound();
        }
        
        // ステージデータを読み込む（初回のみ）
        if (!this.levelLoader.getCurrentStageData()) {
            await this.initializeStageData();
            this.initLevel();
        }
        
        this.gameState.reset();
        this.player.reset();
        this.damageEffect = 0;
        this.scoreAnimations = [];
        
        // BGMを開始
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playGameBGM();
        }
        
        this.updateUIVisibility();
    }
    
    updateUIVisibility() {
        const screens = {
            'start': document.querySelector('.start-screen'),
            'gameOver': document.querySelector('.game-over-screen'),
            'levelComplete': document.querySelector('.level-complete-screen'),
            'playing': document.querySelector('.game-area')
        };
        
        Object.keys(screens).forEach(state => {
            if (screens[state]) {
                screens[state].style.display = state === this.gameState.state ? 'flex' : 'none';
            }
        });
    }
    
    restartGame() {
        this.startGame();
    }
    
    backToTitle() {
        this.gameState.setState('start');
        this.updateUIVisibility();
        
        // タイトル画面では音楽を停止
        if (this.musicSystem.isInitialized) {
            this.musicSystem.stopBGM();
        }
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        try {
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastTime) / 1000; // 秒に変換
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
        } catch (error) {
            console.error('ゲームループエラー:', error);
            this.stop();
            return;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // 入力状態を更新
        this.inputManager.update();
        
        // デバッグ表示切り替え（2キーまたは@キー）
        if (this.inputManager.isKeyJustPressed('Digit2') || this.inputManager.isKeyJustPressed('KeyD')) {
            this.showJumpDebug = !this.showJumpDebug;
        }
        
        if (!this.gameState.isPlaying()) return;
        
        // タイマー更新
        const timeUp = this.gameState.updateTime(deltaTime);
        if (timeUp) {
            this.gameOver();
            return;
        }
        
        // プレイヤー更新
        const input = this.inputManager.getInput();
        this.player.update(input);
        
        // カメラ更新
        this.updateCamera();
        
        // 敵の更新
        this.updateEnemies();
        
        // コインの更新とアニメーション
        this.updateCoins();
        
        // スプリングの更新
        this.updateSprings();
        
        // 衝突判定
        this.checkCollisions();
        
        // 境界チェック
        this.checkBoundaries();
        
        // パーティクル更新
        this.updateParticles(deltaTime);
        
        // スコアアニメーション更新
        this.updateScoreAnimations();
        
        // 背景アニメーション
        this.backgroundAnimation += deltaTime * 50;
        
        // ダメージエフェクト更新
        if (this.damageEffect > 0) {
            this.damageEffect--;
        }
    }
    
    updateCamera() {
        // カメラはプレイヤーを追従
        const targetX = this.player.x - CANVAS_WIDTH / 2;
        this.camera.x = Math.max(0, Math.min(targetX, 3000 - CANVAS_WIDTH));
    }
    
    checkCollisions() {
        // プラットフォームとの衝突判定
        let onPlatform = false;
        
        this.platforms.forEach(platform => {
            const playerBounds = this.player.getBounds();
            if (this.checkCollision(playerBounds, platform)) {
                // 上から乗る
                if (this.player.velY > 0 && 
                    playerBounds.y < platform.y && 
                    playerBounds.y + playerBounds.height < platform.y + platform.height / 2) {
                    
                    const newY = platform.y - playerBounds.height;
                    // 座標範囲チェック
                    if (newY >= 0 && newY <= CANVAS_HEIGHT - playerBounds.height) {
                        this.player.y = newY;
                        this.player.velY = 0;
                    }
                    
                    onPlatform = true;
                }
                // 下から衝突
                else if (this.player.velY < 0 && 
                         playerBounds.y > platform.y) {
                    const newY = platform.y + platform.height;
                    // 座標範囲チェック
                    if (newY >= 0 && newY <= CANVAS_HEIGHT - this.player.height) {
                        this.player.y = newY;
                    }
                    this.player.velY = 0;
                }
                // 横から衝突
                else if (playerBounds.x < platform.x && this.player.velX > 0) {
                    const newX = platform.x - playerBounds.width;
                    // 座標範囲チェック
                    if (newX >= 0 && newX <= CANVAS_WIDTH - playerBounds.width) {
                        this.player.x = newX;
                    }
                    this.player.velX = 0;
                }
                else if (playerBounds.x > platform.x && this.player.velX < 0) {
                    const newX = platform.x + platform.width;
                    // 座標範囲チェック
                    if (newX >= 0 && newX <= CANVAS_WIDTH - playerBounds.width) {
                        this.player.x = newX;
                    }
                    this.player.velX = 0;
                }
            }
        });
        
        // プラットフォームに立っているかチェック（地面判定は削除）
        this.player.onGround = onPlatform;
        
        // 敵との衝突判定
        this.enemies.forEach((enemy, enemyIndex) => {
            if (!enemy.isDead) {
                if (this.checkCollision(this.player.getBounds(), enemy)) {
                    const playerBounds = this.player.getBounds();
                    
                    // 踏みつけ判定：プレイヤーが敵の上から落下している場合
                    if (this.player.velY > 0 && // 下向きに移動中
                        playerBounds.y < enemy.y && // プレイヤーが敵より上にいる
                        playerBounds.y + playerBounds.height < enemy.y + enemy.height * 0.7) { // プレイヤーの足が敵の上部にある
                        
                        // 敵を撃破
                        this.enemies.splice(enemyIndex, 1);
                        
                        // 敵踏みつけ効果音を再生
                        if (this.musicSystem.isInitialized) {
                            this.musicSystem.playEnemyStompSound();
                        }
                        
                        // バウンド
                        this.player.velY = -10;
                        this.gameState.defeatEnemy();
                        
                        // スコア加算
                        this.gameState.addScore(100);
                        this.createScoreAnimation(enemy.x + enemy.width / 2, enemy.y, 100);
                        
                        return; // 踏みつけ成功時はダメージを受けない
                    } else {
                        // 通常の衝突（横から当たった場合）
                        
                        // ダメージ効果音を再生
                        if (this.musicSystem.isInitialized) {
                            this.musicSystem.playDamageSound();
                        }
                        
                        this.loseLife();
                        return; // 一度の衝突で複数回呼ばれるのを防ぐ
                    }
                }
            }
        });
        
        // コインとの衝突判定
        this.coins.forEach((coin) => {
            if (!coin.collected && this.checkCollision(this.player.getBounds(), coin)) {
                coin.collected = true;
                this.gameState.collectCoin();
                
                // コイン取得効果音を再生
                if (this.musicSystem.isInitialized) {
                    this.musicSystem.playCoinSound();
                }
                
                // スコアアニメーション
                this.createScoreAnimation(coin.x + coin.width / 2, coin.y, 10);
            }
        });
        
        // スプリングとの衝突判定
        this.springs.forEach(spring => {
            const springBounds = {
                x: spring.x,
                y: spring.y,
                width: spring.width,
                height: spring.height
            };
            
            if (this.checkCollision(this.player.getBounds(), springBounds)) {
                // プレイヤーが上から接触している場合のみ発動
                if (this.player.velY > 0 && this.player.y < spring.y) {
                    // 大ジャンプ
                    this.player.velY = -spring.bouncePower;
                    this.player.onGround = false;
                    
                    // スプリング発動
                    spring.compression = 1;
                    spring.triggered = true;
                    
                    // スプリング効果音を再生
                    if (this.musicSystem.isInitialized) {
                        this.musicSystem.playSpringSound();
                    }
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
    
    checkBoundaries() {
        const worldWidth = 3000;
        const worldHeight = CANVAS_HEIGHT;
        
        // プレイヤー座標の妥当性チェック
        if (!isFinite(this.player.x) || !isFinite(this.player.y)) {
            console.error('プレイヤー座標が無効です:', this.player.x, this.player.y);
            this.player.x = this.player.width;
            this.player.y = this.player.height;
            return;
        }
        
        // プレイヤーの境界チェック
        if (this.player.x < 0) {
            this.player.x = 0;
            this.player.velX = 0;
        }
        if (this.player.x + this.player.width > worldWidth) {
            const newX = worldWidth - this.player.width;
            this.player.x = newX;
            this.player.velX = 0;
        }
        
        // 落下死判定
        if (this.player.y > worldHeight && !this.player.isDead) {
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
                // 地上敵の境界処理
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
                // 敵を初期位置にリセット
                enemy.x = enemy.originalX;
                enemy.y = enemy.originalY;
                enemy.velY = 0;
            }
        });
    }
    
    updateEnemies() {
        if (!Array.isArray(this.enemies)) {
            console.error('enemies配列が無効です');
            return;
        }
        
        this.enemies.forEach(enemy => {
            if (!enemy || typeof enemy !== 'object') {
                console.warn('無効な敵オブジェクト:', enemy);
                return;
            }
            
            enemy.animTimer = (enemy.animTimer || 0) + 1;
            enemy.x = (enemy.x || 0) + (enemy.velX || 0);
            
            if (enemy.type === 'slime') {
                // スライムの移動パターン
                if (Math.abs(enemy.x - enemy.originalX) > 100) {
                    enemy.velX *= -1;
                    enemy.direction *= -1;
                }
            } else if (enemy.type === 'bird') {
                // 鳥の飛行パターン
                enemy.y = enemy.originalY + Math.sin(enemy.animTimer * 0.05) * 30;
            }
        });
    }
    
    updateCoins() {
        this.coins.forEach((coin) => {
            if (!coin.collected) {
                // 回転アニメーション
                coin.rotation += 0.05;
                
                // 浮遊アニメーション
                coin.floatOffset = Math.sin(this.gameTime * 2 + coin.x * 0.01) * 5;
                coin.y = coin.baseY + coin.floatOffset;
            }
        });
    }
    
    updateSprings() {
        this.springs.forEach(spring => {
            // スプリングの圧縮アニメーション
            if (spring.compression > 0) {
                spring.compression *= 0.9;
                if (spring.compression < 0.01) {
                    spring.compression = 0;
                    spring.triggered = false;
                }
            }
        });
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.velX * deltaTime * 60;
            particle.y += particle.velY * deltaTime * 60;
            particle.velY += GRAVITY * deltaTime * 60;
            particle.opacity = Math.max(0, particle.life);
            
            return particle.life > 0;
        });
    }
    
    updateScoreAnimations() {
        this.scoreAnimations = this.scoreAnimations.filter(anim => anim.update());
    }
    
    createScoreAnimation(x, y, value) {
        this.scoreAnimations.push(new ScoreAnimation(x, y, value));
    }
    
    createParticle(x, y, velX, velY, color) {
        this.particles.push({
            x, y, velX, velY, color,
            life: 1,
            opacity: 1
        });
    }
    
    render() {
        // 背景描画
        this.svg.drawBackground(this.backgroundAnimation);
        
        // カメラ変換
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        // プラットフォーム描画
        this.platforms.forEach(platform => {
            if (this.isInView(platform)) {
                this.svg.drawPlatform(platform);
            }
        });
        
        // スプリング描画
        this.springs.forEach(spring => {
            if (this.isInView(spring)) {
                const compressionScale = 1 - spring.compression * 0.5;
                this.svg.drawItem('spring', spring.x, spring.y + spring.height * (1 - compressionScale), 
                                spring.width, spring.height * compressionScale, 
                                { compression: spring.compression });
            }
        });
        
        // コイン描画
        this.coins.forEach(coin => {
            if (!coin.collected && this.isInView(coin)) {
                this.svg.drawItem('coin', coin.x, coin.y, coin.width, coin.height, 
                                { rotation: coin.rotation });
            }
        });
        
        // 敵描画
        this.enemies.forEach(enemy => {
            if (this.isInView(enemy)) {
                this.svg.drawEnemy(enemy.type, enemy.x, enemy.y, enemy.width, enemy.height, 
                                 enemy.animTimer, enemy.direction);
            }
        });
        
        // プレイヤー描画
        if (!this.player.isDead) {
            const blinkRate = this.player.invulnerable ? Math.floor(this.player.invulnerabilityTime / 10) % 2 : 0;
            if (!blinkRate) {
                this.svg.drawPlayer(
                    this.player.x, 
                    this.player.y, 
                    this.player.width, 
                    this.player.height,
                    {
                        velX: this.player.velX,
                        velY: this.player.velY,
                        animFrame: this.player.animFrame,
                        onGround: this.player.onGround,
                        health: this.player.health
                    }
                );
            }
        }
        
        // ゴールフラッグ描画
        if (this.flag && this.isInView(this.flag)) {
            this.svg.drawItem('flag', this.flag.x, this.flag.y, 60, 80);
        }
        
        // パーティクル描画
        this.renderParticles();
        
        this.ctx.restore();
        
        // スコアアニメーション描画（カメラ変換外）
        this.renderScoreAnimations();
        
        // UI描画
        this.renderUI();
        
        // ダメージエフェクト
        if (this.damageEffect > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageEffect / 60 * 0.3})`;
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        
        // ジャンプデバッグ表示
        this.renderJumpStats();
    }
    
    isInView(obj) {
        return obj.x + obj.width > this.camera.x &&
               obj.x < this.camera.x + CANVAS_WIDTH;
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
            this.ctx.restore();
        });
    }
    
    renderScoreAnimations() {
        this.scoreAnimations.forEach(animation => {
            animation.render(this.ctx, this.camera);
        });
    }
    
    loseLife() {
        const isDead = this.player.takeDamage();
        
        // ダメージエフェクト：画面を少し赤くする
        this.damageEffect = 30; // 30フレーム間エフェクト表示
        
        if (isDead) {
            const gameOver = this.gameState.loseLife();
            if (gameOver) {
                this.gameOver();
            } else {
                this.player.reset();
            }
        }
    }
    
    fallDeath() {
        // 穴落ち効果音を再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playFallDeathSound();
        }
        
        // プレイヤーを即死状態にする
        this.player.isDead = true;
        this.player.health = 0;
        
        // 落下パーティクル生成
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = Math.random() * 5 + 2;
            this.createParticle(
                this.player.x + this.player.width / 2,
                CANVAS_HEIGHT - 10,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 5,
                '#FF6B6B'
            );
        }
        
        // 画面を停止
        this.player.velX = 0;
        this.player.velY = 0;
        
        // ダメージエフェクト
        this.damageEffect = 30;
        
        // ライフを減らす
        const gameOver = this.gameState.loseLife();
        if (gameOver) {
            this.gameOver();
        } else {
            // 少し遅延を入れてリセット（死亡演出のため）
            setTimeout(() => {
                if (this.gameState.lives > 0) {
                    this.player.reset();
                }
            }, 1000);
        }
    }
    
    gameOver() {
        this.gameState.setState('gameOver');
        this.updateUIVisibility();
        
        // ゲームオーバー効果音を再生
        if (this.musicSystem.isInitialized) {
            this.musicSystem.playGameOverSound();
        }
        
        // BGMを停止
        if (this.musicSystem.isInitialized) {
            this.musicSystem.stopBGM();
        }
        
        // 最終スコアを表示
        try {
            const finalScoreEl = document.getElementById('finalScore');
            if (finalScoreEl) {
                finalScoreEl.textContent = this.gameState.score;
            }
        } catch (error) {
            console.error('最終スコア表示エラー:', error);
        }
    }
    
    levelComplete() {
        this.gameState.completeLevel();
        this.updateUIVisibility();
        
        // BGMを停止
        if (this.musicSystem.isInitialized) {
            this.musicSystem.stopBGM();
        }
        
        // レベルクリアスコアを表示
        try {
            const levelScoreEl = document.getElementById('levelScore');
            if (levelScoreEl) {
                levelScoreEl.textContent = this.gameState.score;
            }
        } catch (error) {
            console.error('レベルスコア表示エラー:', error);
        }
        
        // 花火エフェクト
        for (let i = 0; i < 50; i++) {
            const x = this.player.x + this.player.width / 2;
            const y = this.player.y + this.player.height / 2;
            const angle = (Math.PI * 2 * i) / 50;
            const speed = Math.random() * 10 + 5;
            
            this.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                `hsl(${Math.random() * 360}, 100%, 50%)`
            );
        }
    }
    
    renderUI() {
        // UIの背景パネル
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        // テキストスタイル
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        
        // スコア
        this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 35);
        
        // ライフ（ハートで表示）
        this.ctx.fillText('Life: ', 20, 65);
        for (let i = 0; i < this.gameState.lives; i++) {
            this.ctx.fillText('❤️', 80 + i * 30, 65);
        }
        
        // タイマー
        const remainingTime = Math.max(0, this.gameState.maxTime - this.gameState.time);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = Math.floor(remainingTime % 60);
        this.ctx.fillText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 95);
        
        // コイン収集状況
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(CANVAS_WIDTH - 160, 10, 150, 40);
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Coins: ${this.gameState.coinsCollected}`, CANVAS_WIDTH - 150, 35);
    }
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        if (this.svg.playerRenderer && typeof this.svg.playerRenderer.preloadSVGs === 'function') {
            try {
                await this.svg.playerRenderer.preloadSVGs();
            } catch (error) {
                // エラーは無視
            }
        }
    }
    
    // ジャンプ統計をリアルタイムで表示
    renderJumpStats() {
        try {
            // デバッグ表示がオフの場合は何もしない
            if (!this.showJumpDebug) {
                return;
            }
            
            // 確実にコンテキストを取得
            const ctx = this.ctx;
            if (!ctx) {
                return;
            }
            
            // ゲーム状態が'playing'の時のみ表示
            if (this.gameState.state !== 'playing') {
                return;
            }
            
            // 保存された状態でレンダリング
            ctx.save();
            
            // 黒い半透明の背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(10, 130, 350, 180);
            
            // タイトル
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('🐞 ジャンプデバッグ情報', 20, 155);
            
            // 区切り線
            ctx.strokeStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(15, 165);
            ctx.lineTo(355, 165);
            ctx.stroke();
            
            // 通常のテキスト設定
            ctx.fillStyle = 'white';
            ctx.font = '14px monospace';
            
            let y = 185;
            const lineHeight = 20;
            
            // プレイヤー存在確認
            if (this.player) {
                // リアルタイム情報
                ctx.fillStyle = '#4ADE80';
                ctx.fillText(`[リアルタイム]`, 20, y);
                y += lineHeight;
                
                ctx.fillStyle = 'white';
                ctx.fillText(`ジャンプ中: ${this.player.isJumping ? '✅' : '❌'}`, 30, y);
                y += lineHeight;
                
                ctx.fillText(`地面判定: ${this.player.onGround ? '✅' : '❌'}`, 30, y);
                y += lineHeight;
                
                ctx.fillText(`Y速度: ${this.player.velY.toFixed(2)}`, 30, y);
                y += lineHeight;
                
                // 最後のジャンプ統計
                if (this.player.lastJumpStats) {
                    ctx.fillStyle = '#60A5FA';
                    ctx.fillText(`[最後のジャンプ]`, 20, y);
                    y += lineHeight;
                    
                    ctx.fillStyle = 'white';
                    ctx.fillText(`最高到達: ${this.player.lastJumpStats.heightInPlayerUnits}人分`, 30, y);
                    y += lineHeight;
                    
                    ctx.fillText(`ボタン保持: ${this.player.lastJumpStats.buttonHoldTime}フレーム`, 30, y);
                    y += lineHeight;
                }
                
                // 現在のジャンプ高さ（ジャンプ中のみ）
                if (this.player.isJumping && !this.player.onGround) {
                    const currentHeight = this.player.jumpStartY - this.player.y;
                    ctx.fillStyle = '#F59E0B';
                    ctx.fillText(`現在高さ: ${(currentHeight / this.player.height).toFixed(1)}人分`, 30, y);
                }
            } else {
                ctx.fillStyle = 'red';
                ctx.fillText('❌ Player未定義', 15, y);
            }
            
            ctx.restore();
        } catch (error) {
            // エラーは無視
        }
    }
    
    // クリーンアップ
    destroy() {
        try {
            // ゲームループの停止
            this.stop();
            
            // 各システムのクリーンアップ
            if (this.musicSystem && typeof this.musicSystem.destroy === 'function') {
                this.musicSystem.destroy();
            }
            
            if (this.inputManager && typeof this.inputManager.destroy === 'function') {
                this.inputManager.destroy();
            }
            
            // リソースのクリア
            this.platforms = [];
            this.enemies = [];
            this.coins = [];
            this.particles = [];
            this.scoreAnimations = [];
            
            this.isInitialized = false;
        } catch (error) {
            console.error('ゲームのクリーンアップエラー:', error);
        }
    }
}

// ===== ゲーム開始 =====
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // ゲームインスタンスを作成（コンストラクタは同期）
            const game = new Game();
            
            // グローバルにアクセス可能にする（デバッグ用）
            if (typeof window !== 'undefined') {
                window.game = game;
            }
            
            // 非同期初期化を待機
            await game.initialize();
            
            // テスト用関数
            if (typeof window !== 'undefined') {
                window.testStart = function() {
                    if (window.game && window.game.isInitialized) {
                        window.game.startGame();
                        return true;
                    }
                    return false;
                };
            }
            
            // 自動ゲーム状態記録の設定（デバッグ用）
            if (typeof window !== 'undefined' && window.gameStateManager) {
                const originalUpdate = game.update.bind(game);
                game.update = function(deltaTime) {
                    originalUpdate(deltaTime);
                    if (window.gameStateManager && window.gameStateManager.recording) {
                        window.gameStateManager.captureState(game);
                    }
                };
            }
            
        } catch (error) {
            // テスト用にエラー情報を保存
            if (typeof window !== 'undefined') {
                window.gameInitError = error;
                
                // テスト実行のため、空のwindow.gameオブジェクトを作成
                window.game = {
                    svg: null,
                    player: null,
                    gameState: null,
                    isInitialized: false,
                    error: error.message
                };
            }
            throw error;
        }
    });
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}