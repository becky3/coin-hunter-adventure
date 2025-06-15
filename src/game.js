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
        
        // クラス定義の確認
        console.log('=== SVGレンダラークラス確認 ===');
        console.log('SVGPlayerRenderer:', typeof SVGPlayerRenderer);
        console.log('SVGEnemyRenderer:', typeof SVGEnemyRenderer);
        console.log('SVGItemRenderer:', typeof SVGItemRenderer);
        console.log('==========================');
        
        // プレイヤーグラフィックレンダラーを初期化
        if (typeof SVGPlayerRenderer !== 'undefined') {
            try {
                this.playerRenderer = new SVGPlayerRenderer(ctx);
                console.log('✅ SVGPlayerRenderer初期化成功');
            } catch (error) {
                console.error('❌ SVGPlayerRenderer初期化エラー:', error);
                this.playerRenderer = null;
            }
        } else {
            console.error('❌ SVGPlayerRendererクラスが見つかりません');
            this.playerRenderer = null;
        }
        
        // 敵キャラクターレンダラーを初期化
        if (typeof SVGEnemyRenderer !== 'undefined') {
            try {
                this.enemyRenderer = new SVGEnemyRenderer(ctx);
                console.log('✅ SVGEnemyRenderer初期化成功');
            } catch (error) {
                console.error('❌ SVGEnemyRenderer初期化エラー:', error);
                this.enemyRenderer = null;
            }
        } else {
            console.error('❌ SVGEnemyRendererクラスが見つかりません');
            this.enemyRenderer = null;
        }
        
        // アイテムレンダラーを初期化
        if (typeof SVGItemRenderer !== 'undefined') {
            try {
                this.itemRenderer = new SVGItemRenderer(ctx);
                console.log('✅ SVGItemRenderer初期化成功');
            } catch (error) {
                console.error('❌ SVGItemRenderer初期化エラー:', error);
                this.itemRenderer = null;
            }
        } else {
            console.error('❌ SVGItemRendererクラスが見つかりません');
            this.itemRenderer = null;
        }
        
        // 全SVGファイルを事前読み込み
        this.preloadAllSVGs();
        
        // プロトコルチェックと警告システム
        this.checkProtocolAndWarn();
    }
    
    // プロトコルチェックと警告表示
    checkProtocolAndWarn() {
        if (window.location.protocol === 'file:') {
            // test.html専用：CORS警告を無効化
            if (window.DISABLE_CORS_WARNING) {
                console.log('📝 テストモード: file://プロトコルですが、テスト実行のため警告を無効化します');
                return;
            }
            
            console.error('🚫 CRITICAL ERROR: ゲームがfile://プロトコルで開かれています');
            console.error('🚫 SVGファイルはCORS制限により読み込めません');
            console.error('✅ SOLUTION: HTTPサーバーでアクセスしてください');
            console.error('📝 例: python3 -m http.server 8080 を実行後、http://localhost:8080/ でアクセス');
            
            // ビジュアル警告を表示（一度だけ）
            if (!window._corsWarningShown) {
                window._corsWarningShown = true;
                this.showProtocolWarning();
            }
        } else {
            console.log('✅ HTTPサーバー経由でアクセスされています:', window.location.href);
        }
    }
    
    // プロトコル警告の表示
    showProtocolWarning() {
        // 赤いオーバーレイを追加
        const warningDiv = document.createElement('div');
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '0';
        warningDiv.style.left = '0';
        warningDiv.style.width = '100%';
        warningDiv.style.height = '100%';
        warningDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        warningDiv.style.color = 'white';
        warningDiv.style.fontSize = '24px';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.padding = '50px';
        warningDiv.style.zIndex = '10000';
        warningDiv.style.display = 'flex';
        warningDiv.style.flexDirection = 'column';
        warningDiv.style.justifyContent = 'center';
        warningDiv.style.alignItems = 'center';
        
        warningDiv.innerHTML = `
            <h1>⚠️ アクセス方法エラー ⚠️</h1>
            <p>ゲームが file:// プロトコルで開かれています</p>
            <p>SVGファイルが読み込めないため、グラフィックが表示されません</p>
            <br>
            <h2>✅ 解決方法:</h2>
            <div style="text-align: left; max-width: 600px; margin: 0 auto;">
                <p><strong>1. HTTPサーバーを起動：</strong></p>
                <p style="background: #333; color: #0f0; padding: 10px; border-radius: 5px; font-family: monospace;">
                    python3 -m http.server 8080<br>
                    # または<br>
                    npx serve .<br>
                    # または<br>
                    php -S localhost:8080
                </p>
                <p><strong>2. ブラウザでHTTPアクセス：</strong></p>
                <p style="background: #333; color: #ff0; padding: 10px; border-radius: 5px; font-family: monospace;">
                    http://localhost:8080/index.html
                </p>
            </div>
            <br>
            <button onclick="this.parentElement.style.display='none'" 
                    style="padding: 10px 20px; font-size: 16px; background: white; color: black; border: none; border-radius: 5px; cursor: pointer;">
                警告を閉じる（フォールバック描画でプレイ）
            </button>
        `;
        
        document.body.appendChild(warningDiv);
        
        // ブラウザアラートも表示
        setTimeout(() => {
            alert('ゲームのグラフィックが正常に表示されません。\n\nHTTPサーバーを起動後、http://localhost:8080/ でアクセスしてください。\n\n例: python3 -m http.server 8080');
        }, 1000);
    }
    
    // 全SVGファイルの事前読み込み
    async preloadAllSVGs() {
        // Protocol check - skip SVG loading for file:// protocol
        if (window.location.protocol === 'file:') {
            console.log('🚫 file://プロトコルのためSVG読み込みをスキップします');
            return; // Skip SVG loading
        }
        
        console.log('🚀 全SVGファイルの事前読み込み開始...');
        const promises = [];
        
        if (this.playerRenderer && this.playerRenderer.preloadSVGs) {
            promises.push(this.playerRenderer.preloadSVGs());
        }
        
        if (this.enemyRenderer && this.enemyRenderer.preloadSVGs) {
            promises.push(this.enemyRenderer.preloadSVGs());
        }
        
        if (this.itemRenderer && this.itemRenderer.preloadSVGs) {
            promises.push(this.itemRenderer.preloadSVGs());
        }
        
        try {
            await Promise.all(promises);
            console.log('✅ 全SVGファイルの事前読み込み完了！');
        } catch (error) {
            console.error('❌ SVGファイル事前読み込み中にエラー:', error);
        }
    }
    
    // Protocol warning display
    showProtocolWarning() {
        // Create a warning overlay on the game canvas
        if (this.ctx && this.ctx.canvas) {
            const canvas = this.ctx.canvas;
            this.ctx.save();
            
            // Semi-transparent red overlay
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Warning text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            this.ctx.fillText('⚠️ CORS ERROR', centerX, centerY - 60);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Game is accessed via file:// protocol', centerX, centerY - 20);
            this.ctx.fillText('SVG files cannot be loaded', centerX, centerY + 10);
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText('Solution: Access via http://localhost:8080/', centerX, centerY + 50);
            
            this.ctx.restore();
        }
        
        // Also show browser alert as backup
        setTimeout(() => {
            alert(`⚠️ CORS ERROR\n\nThe game is being accessed via file:// protocol.\nSVG graphics cannot be loaded due to CORS restrictions.\n\nSolution: Please access the game via:\nhttp://localhost:8080/index.html`);
        }, 1000);
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
    
    // プレイヤーキャラクター（SVGファイルベース）
    drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame, velX = 0, velY = 0) {
        if (!this.playerRenderer) {
            throw new Error('プレイヤーSVGレンダラーが初期化されていません');
        }
        this.playerRenderer.drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame, velX, velY);
    }
    
    // フォールバックプレイヤー描画
    drawPlayerFallback(x, y, width, height, health, direction, invulnerable) {
        const scale = health === 2 ? 1.0 : 0.85;
        const actualWidth = width * scale;
        const actualHeight = height * scale;
        const offsetY = health === 1 ? height * 0.15 : 0;
        
        this.ctx.save();
        
        if (invulnerable) {
            this.ctx.globalAlpha = 0.7;
        }
        
        this.ctx.translate(x + width / 2, y + offsetY);
        if (direction < 0) {
            this.ctx.scale(-1, 1);
        }
        this.ctx.translate(-actualWidth / 2, 0);
        
        // 体（シャツ）
        const bodyGradient = this.ctx.createLinearGradient(0, actualHeight * 0.4, 0, actualHeight);
        bodyGradient.addColorStop(0, health === 2 ? '#4A90E2' : '#E91E63');
        bodyGradient.addColorStop(1, health === 2 ? '#2171B5' : '#AD1457');
        
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(actualWidth * 0.15, actualHeight * 0.4, actualWidth * 0.7, actualHeight * 0.6);
        
        // 頭（肌色）
        const headGradient = this.ctx.createRadialGradient(actualWidth * 0.5, actualHeight * 0.25, 0, actualWidth * 0.5, actualHeight * 0.25, actualWidth * 0.35);
        headGradient.addColorStop(0, '#FFDBAC');
        headGradient.addColorStop(1, '#F4C2A1');
        
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(actualWidth * 0.5, actualHeight * 0.25, actualWidth * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 髪
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.arc(actualWidth * 0.5, actualHeight * 0.2, actualWidth * 0.32, Math.PI, Math.PI * 2);
        this.ctx.fill();
        
        // 目
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(actualWidth * 0.4, actualHeight * 0.22, actualWidth * 0.05, actualWidth * 0.04, 0, 0, Math.PI * 2);
        this.ctx.ellipse(actualWidth * 0.6, actualHeight * 0.22, actualWidth * 0.05, actualWidth * 0.04, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 瞳
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(actualWidth * 0.4, actualHeight * 0.22, actualWidth * 0.02, 0, Math.PI * 2);
        this.ctx.arc(actualWidth * 0.6, actualHeight * 0.22, actualWidth * 0.02, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鼻
        this.ctx.fillStyle = '#E8B896';
        this.ctx.beginPath();
        this.ctx.arc(actualWidth * 0.5, actualHeight * 0.27, actualWidth * 0.015, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 口
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(actualWidth * 0.5, actualHeight * 0.31, actualWidth * 0.03, 0.2 * Math.PI, 0.8 * Math.PI);
        this.ctx.stroke();
        
        // 腕
        this.ctx.fillStyle = headGradient;
        this.ctx.fillRect(actualWidth * 0.05, actualHeight * 0.45, actualWidth * 0.1, actualHeight * 0.35);
        this.ctx.fillRect(actualWidth * 0.85, actualHeight * 0.45, actualWidth * 0.1, actualHeight * 0.35);
        
        // 足
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(actualWidth * 0.25, actualHeight * 0.85, actualWidth * 0.15, actualHeight * 0.15);
        this.ctx.fillRect(actualWidth * 0.6, actualHeight * 0.85, actualWidth * 0.15, actualHeight * 0.15);
        
        this.ctx.restore();
    }
    
    // ヘルパーメソッド：色を明るくする
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    // ヘルパーメソッド：色を暗くする
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B) * 0x100).toString(16).slice(1);
    }
    
    // スライムのSVG描画（外部ファイル使用）
    drawSlime(x, y, width, height, animTimer) {
        if (!this.enemyRenderer) {
            throw new Error('敵SVGレンダラーが初期化されていません');
        }
        this.enemyRenderer.drawEnemy('slime', x, y, width, height, animTimer);
    }
    
    // スライム本体のSVGパス作成
    createSlimeBodyPath(width, height) {
        const path = new Path2D();
        // 柔らかい楕円形の本体
        path.ellipse(width / 2, height * 0.7, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
        return path;
    }
    
    // スライム頭部のSVGパス作成
    createSlimeHeadPath(width, height) {
        const path = new Path2D();
        // より有機的な頭部の形状
        const centerX = width / 2;
        const centerY = height * 0.4;
        const radiusX = width * 0.3;
        const radiusY = height * 0.25;
        
        // ベジェ曲線で自然な形状を作成
        path.moveTo(centerX - radiusX, centerY);
        path.quadraticCurveTo(centerX - radiusX, centerY - radiusY * 1.2, centerX, centerY - radiusY * 1.1);
        path.quadraticCurveTo(centerX + radiusX, centerY - radiusY * 1.2, centerX + radiusX, centerY);
        path.quadraticCurveTo(centerX + radiusX * 0.8, centerY + radiusY * 0.8, centerX, centerY + radiusY);
        path.quadraticCurveTo(centerX - radiusX * 0.8, centerY + radiusY * 0.8, centerX - radiusX, centerY);
        path.closePath();
        
        return path;
    }
    
    // スライムハイライトのSVGパス作成
    createSlimeHighlightPath(width, height) {
        const path = new Path2D();
        path.ellipse(width * 0.4, height * 0.35, width * 0.15, height * 0.12, 0, 0, Math.PI * 2);
        return path;
    }
    
    // スライムの目を描画
    drawSlimeEyes(width, height, eyeBlink) {
        // 目の白い部分
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.38, height * 0.35, width * 0.08, width * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.62, height * 0.35, width * 0.08, width * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 瞳
        if (eyeBlink > 0.5) {
            this.ctx.fillStyle = '#1A1A1A';
            this.ctx.beginPath();
            this.ctx.arc(width * 0.38, height * 0.37, width * 0.04, 0, Math.PI * 2);
            this.ctx.arc(width * 0.62, height * 0.37, width * 0.04, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 瞳のハイライト
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(width * 0.38 - width * 0.015, height * 0.35, width * 0.015, 0, Math.PI * 2);
            this.ctx.arc(width * 0.62 - width * 0.015, height * 0.35, width * 0.015, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // スライムの口を描画
    drawSlimeMouth(width, height) {
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.5, height * 0.45, width * 0.06, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();
    }
    
    // 鳥のSVG描画（外部ファイル使用）
    drawBird(x, y, width, height, animTimer) {
        if (!this.enemyRenderer) {
            throw new Error('敵SVGレンダラーが初期化されていません');
        }
        this.enemyRenderer.drawEnemy('bird', x, y, width, height, animTimer);
    }
    
    // コインのSVG描画（外部ファイル使用）
    drawCoin(x, y, width, height, rotation) {
        if (!this.itemRenderer) {
            throw new Error('アイテムSVGレンダラーが初期化されていません');
        }
        this.itemRenderer.drawItem('coin', x, y, width, height, { rotation });
    }
    
    // フラグのSVG描画（外部ファイル使用）
    drawFlag(x, y, width, height) {
        if (!this.itemRenderer) {
            throw new Error('アイテムSVGレンダラーが初期化されていません');
        }
        this.itemRenderer.drawItem('flag', x, y, width, height);
    }
    
    // スプリングのSVG描画（外部ファイル使用）
    drawSpring(x, y, width, height, compression = 0) {
        if (!this.itemRenderer) {
            throw new Error('アイテムSVGレンダラーが初期化されていません');
        }
        this.itemRenderer.drawItem('spring', x, y, width, height, { compression });
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

// ===== スコアアニメーションクラス =====
class ScoreAnimation {
    constructor(x, y, points) {
        this.x = x;
        this.y = y - 30; // オブジェクトより30px上に表示
        this.originalY = this.y;
        this.points = points;
        this.text = `${points}`; // 「+」記号削除
        
        this.velY = -0.7; // より短い上向きの速度（1/3に短縮）
        this.alpha = 1.0; // 透明度
        this.isActive = true;
        
        this.lifetime = 0;
        this.maxLifetime = 500; // 0.5秒間表示
        this.moveTime = 150; // 0.15秒間移動
        
        // アニメーション段階
        this.phase = 'move'; // 'move' -> 'fade' -> 'done'
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        this.lifetime += deltaTime * 1000; // ms に変換
        
        // シンプルなアニメーション: 短く上に移動してから止まってフェードアウト
        if (this.lifetime < this.moveTime) {
            // 移動段階: 短く上に移動
            this.phase = 'move';
            this.y += this.velY;
            this.alpha = 1.0; // 完全に表示
        } else if (this.lifetime < this.maxLifetime) {
            // フェード段階: 移動停止してフェードアウト
            this.phase = 'fade';
            // 移動停止
            const fadeProgress = (this.lifetime - this.moveTime) / (this.maxLifetime - this.moveTime);
            this.alpha = Math.max(0, 1 - fadeProgress);
        } else {
            // 終了
            this.phase = 'done';
            this.isActive = false;
        }
    }
    
    render(ctx, camera) {
        if (!this.isActive || this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // コミック風の太いフォント
        ctx.font = 'bold 18px "Comic Sans MS", cursive, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // 太い黒縁取り（コミック風）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, screenX, screenY);
        
        // 白いテキスト
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(this.text, screenX, screenY);
        
        ctx.restore();
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
        
        // 可変ジャンプ用プロパティ
        this.jumpButtonPressed = false;
        this.jumpTime = 0;
        this.canVariableJump = false;
        
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
        
        // 座標変更前のログ
        const oldX = this.x, oldY = this.y;
        
        this.x += this.velX;
        this.y += this.velY;
        
        // 大幅な座標変更または異常な座標を検出
        if (Math.abs(this.x - oldX) > 100 || Math.abs(this.y - oldY) > 100 || 
            this.x < -50 || this.x > CANVAS_WIDTH + 50 || this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
            console.error(`🚨 異常な座標変更/位置を検出:`, {
                before: {x: oldX, y: oldY},
                after: {x: this.x, y: this.y},
                vel: {x: this.velX, y: this.velY},
                jump: {isJumping: this.isJumping, onGround: this.onGround, canVariable: this.canVariableJump}
            });
        }
        
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
        
        // 可変ジャンプロジック
        if (input.jump && this.onGround && !this.isJumping) {
            // ジャンプ開始
            this.velY = -this.jumpPower;
            this.onGround = false;
            this.isJumping = true;
            this.jumpButtonPressed = true;
            this.jumpTime = 0;
            this.canVariableJump = true;
            
            // ジャンプ効果音を再生（ゲームインスタンスを参照）
            if (window.game && window.game.musicSystem && window.game.musicSystem.isInitialized) {
                window.game.musicSystem.playJumpSound();
            }
        }
        
        // 可変ジャンプ処理（空中でボタンが押され続けている間）
        if (input.jump && this.isJumping && this.canVariableJump && this.velY < 0) {
            this.jumpButtonPressed = true;
            this.jumpTime++;
            
            console.log(`可変ジャンプ処理: time=${this.jumpTime}, velY=${this.velY}, pos=(${this.x}, ${this.y})`);
            
            // 最大ジャンプ時間内で、上昇中の場合のみ可変ジャンプ効果を適用
            if (this.jumpTime < PLAYER_CONFIG.maxJumpTime) {
                const oldVelY = this.velY;
                // 重力の一部を相殺して滞空時間を延長
                this.velY -= GRAVITY * 0.3; // 重力の30%を相殺
                console.log(`可変ジャンプ効果: velY ${oldVelY} -> ${this.velY}`);
            } else {
                // 最大時間に達したら可変ジャンプ終了
                this.canVariableJump = false;
                console.log(`可変ジャンプ終了: 最大時間到達`);
            }
        }
        
        // ジャンプボタンが離された時
        if (!input.jump) {
            if (this.jumpButtonPressed && this.isJumping && this.velY < 0) {
                // 上昇中にボタンを離した場合、上昇速度を減衰
                this.velY *= PLAYER_CONFIG.jumpDecayRate;
            }
            this.isJumping = false;
            this.jumpButtonPressed = false;
            this.canVariableJump = false;
        }
    }
    
    updateAnimation() {
        this.animTimer++;
        if (this.animTimer > 8) { // アニメーション速度を遅く（5 -> 8）して見やすく
            this.animFrame = (this.animFrame + 1) % 120; // より大きなフレーム範囲
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
        console.log(`プレイヤーリセット: (${this.x}, ${this.y}) -> (${PLAYER_CONFIG.spawnX}, ${PLAYER_CONFIG.spawnY})`);
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
        
        // 可変ジャンプ用プロパティのリセット
        this.jumpButtonPressed = false;
        this.jumpTime = 0;
        this.canVariableJump = false;
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
        this.scoreAnimations = [];
        
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
        
        // SVGファイルの事前読み込み
        this.preloadSVGs().then(() => {
            console.log('ゲームの初期化完了');
        });
        
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
            velX: e.type === 'bird' ? -ENEMY_CONFIG[e.type].speed : ENEMY_CONFIG[e.type].speed,
            direction: e.type === 'bird' ? -1 : 1,
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
            velX: e.type === 'bird' ? -ENEMY_CONFIG[e.type].speed : ENEMY_CONFIG[e.type].speed,
            direction: e.type === 'bird' ? -1 : 1,
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
        
        // スコアアニメーション更新
        this.updateScoreAnimations(deltaTime);
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
                    const newY = platform.y + platform.height;
                    console.log(`プレイヤーY座標変更: ${this.player.y} -> ${newY} (プラットフォーム下側衝突)`);
                    // 座標範囲チェック
                    if (newY >= 0 && newY <= CANVAS_HEIGHT - this.player.height) {
                        this.player.y = newY;
                    } else {
                        console.warn(`異常なY座標を検出、変更をスキップ: ${newY}`);
                    }
                    this.player.velY = 0;
                }
                // 横から衝突
                else if (playerBounds.x < platform.x && this.player.velX > 0) {
                    const newX = platform.x - playerBounds.width;
                    console.log(`プレイヤーX座標変更: ${this.player.x} -> ${newX} (プラットフォーム左側衝突)`);
                    // 座標範囲チェック
                    if (newX >= 0 && newX <= CANVAS_WIDTH - playerBounds.width) {
                        this.player.x = newX;
                    } else {
                        console.warn(`異常なX座標を検出、変更をスキップ: ${newX}`);
                    }
                    this.player.velX = 0;
                }
                else if (playerBounds.x > platform.x && this.player.velX < 0) {
                    const newX = platform.x + platform.width;
                    console.log(`プレイヤーX座標変更: ${this.player.x} -> ${newX} (プラットフォーム右側衝突)`);
                    // 座標範囲チェック
                    if (newX >= 0 && newX <= CANVAS_WIDTH - playerBounds.width) {
                        this.player.x = newX;
                    } else {
                        console.warn(`異常なX座標を検出、変更をスキップ: ${newX}`);
                    }
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
                        this.createScoreAnimation(enemy.x + enemy.width / 2, enemy.y, 100);
                        
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
                
                // スコアアニメーションを作成
                this.createScoreAnimation(coin.x + coin.width / 2, coin.y, 10);
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
            console.log(`プレイヤーX座標修正: ${this.player.x} -> 0 (左境界)`);
            this.player.x = 0;
            this.player.velX = 0;
        }
        if (this.player.x + this.player.width > worldWidth) {
            const newX = worldWidth - this.player.width;
            console.log(`プレイヤーX座標修正: ${this.player.x} -> ${newX} (右境界)`);
            this.player.x = newX;
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
    
    // ===== スコアアニメーション管理 =====
    createScoreAnimation(x, y, points) {
        const animation = new ScoreAnimation(x, y, points);
        this.scoreAnimations.push(animation);
    }
    
    updateScoreAnimations(deltaTime) {
        // 非アクティブなアニメーションを削除
        this.scoreAnimations = this.scoreAnimations.filter(animation => {
            animation.update(deltaTime);
            return animation.isActive;
        });
    }
    
    renderScoreAnimations() {
        this.scoreAnimations.forEach(animation => {
            animation.render(this.ctx, this.camera);
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
            
            // スコアアニメーション描画
            this.renderScoreAnimations();
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
            this.player.animFrame,
            this.player.velX,
            this.player.velY
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
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        if (this.svg.playerRenderer && typeof this.svg.playerRenderer.preloadSVGs === 'function') {
            try {
                await this.svg.playerRenderer.preloadSVGs();
            } catch (error) {
                console.warn('SVG事前読み込みエラー:', error);
            }
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