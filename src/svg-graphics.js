/**
 * SVGグラフィックシステム
 * プロトコルチェックと警告表示を含む
 */

class SVGGraphics {
    constructor(ctx) {
        this.ctx = ctx;
        this.cache = new Map(); // パスキャッシュ
        
        // プレイヤーグラフィックレンダラーを初期化
        if (typeof SVGPlayerRenderer !== 'undefined') {
            try {
                this.playerRenderer = new SVGPlayerRenderer(ctx);
            } catch (error) {
                this.playerRenderer = null;
            }
        } else {
            this.playerRenderer = null;
        }
        
        // 敵キャラクターレンダラーを初期化
        if (typeof SVGEnemyRenderer !== 'undefined') {
            try {
                this.enemyRenderer = new SVGEnemyRenderer(ctx);
            } catch (error) {
                this.enemyRenderer = null;
            }
        } else {
            this.enemyRenderer = null;
        }
        
        // アイテムレンダラーを初期化
        if (typeof SVGItemRenderer !== 'undefined') {
            try {
                this.itemRenderer = new SVGItemRenderer(ctx);
            } catch (error) {
                this.itemRenderer = null;
            }
        } else {
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
                return;
            }
            
            // ビジュアル警告を表示（一度だけ）
            if (!window._corsWarningShown) {
                window._corsWarningShown = true;
                this.showProtocolWarning();
            }
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
            <h2>✅ 正しいアクセス方法：</h2>
            <pre style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px;">
1. ターミナルでプロジェクトフォルダに移動
2. HTTPサーバーを起動: python3 -m http.server 8080
3. ブラウザで開く: http://localhost:8080/</pre>
            <br>
            <button id="closeWarning" style="padding: 10px 20px; font-size: 18px;">理解しました</button>
        `;
        
        document.body.appendChild(warningDiv);
        
        // ボタンクリックで警告を閉じる
        document.getElementById('closeWarning').addEventListener('click', () => {
            warningDiv.remove();
        });
        
        // canvasにも警告を表示
        if (this.ctx && this.ctx.canvas) {
            const canvas = this.ctx.canvas;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // 黒い背景
            this.ctx.fillStyle = 'black';
            this.ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 赤い警告テキスト
            this.ctx.fillStyle = 'red';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const messages = [
                '⚠️ file:// プロトコルエラー ⚠️',
                'HTTPサーバーで開いてください',
                'python3 -m http.server 8080',
                'http://localhost:8080/'
            ];
            
            messages.forEach((msg, index) => {
                this.ctx.fillText(msg, centerX, centerY + (index - 1.5) * 40);
            });
        }
        
        // 警告ポップアップ
        setTimeout(() => {
            alert('ゲームのグラフィックが正常に表示されません。\n\nHTTPサーバーを起動後、http://localhost:8080/ でアクセスしてください。\n\n例: python3 -m http.server 8080');
        }, 1000);
    }
    
    // 全SVGファイルの事前読み込み
    async preloadAllSVGs() {
        // Protocol check - skip SVG loading for file:// protocol
        if (window.location.protocol === 'file:') {
            return; // Skip SVG loading
        }
        
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
        } catch (error) {
            // エラーは個別のレンダラーでハンドリング
        }
    }
    
    // プレイヤー描画メソッド
    drawPlayer(x, y, width, height, animState = {}) {
        if (this.playerRenderer) {
            // animStateから必要なパラメータを抽出して渡す
            const direction = animState.facing === 'left' ? -1 : 1;
            this.playerRenderer.drawPlayer(
                x, y, width, height, 
                animState.health || 3,
                direction,
                animState.invulnerable || false,
                animState.animFrame || 0,
                animState.velX || 0,
                animState.velY || 0
            );
        } else {
            // フォールバック：シンプルな四角形
            this.ctx.fillStyle = '#4299E1';
            this.ctx.fillRect(x, y, width, height);
        }
    }
    
    // 敵描画メソッド
    drawEnemy(type, x, y, width, height, animTimer = 0, direction = 1) {
        if (this.enemyRenderer) {
            this.enemyRenderer.drawEnemy(type, x, y, width, height, animTimer, direction);
        } else {
            // フォールバック：シンプルな四角形
            this.ctx.fillStyle = type === 'slime' ? '#68D391' : '#F56565';
            this.ctx.fillRect(x, y, width, height);
        }
    }
    
    // アイテム描画メソッド
    drawItem(type, x, y, width, height, animData = {}) {
        if (this.itemRenderer) {
            this.itemRenderer.drawItem(type, x, y, width, height, animData);
        } else {
            // フォールバック：シンプルな形状
            this.ctx.fillStyle = type === 'coin' ? '#FFD700' : '#4299E1';
            if (type === 'coin') {
                // コインは円形
                this.ctx.beginPath();
                this.ctx.arc(x + width/2, y + height/2, width/2, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // その他は四角形
                this.ctx.fillRect(x, y, width, height);
            }
        }
    }
    
    // プラットフォーム描画
    drawPlatform(platform) {
        const gradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
        gradient.addColorStop(0, '#68D391');
        gradient.addColorStop(0.5, '#4ADE80');
        gradient.addColorStop(1, '#2ECC71');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // 縁取り
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        
        // ハイライト
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(platform.x, platform.y, platform.width, 4);
    }
    
    // 背景描画
    drawBackground(backgroundAnimation) {
        // グラデーション背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98D8E8');
        gradient.addColorStop(1, '#F0F8FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        // 雲の描画
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const cloudOffset = backgroundAnimation * 0.1;
        
        for (let i = 0; i < 5; i++) {
            const x = ((i * 200 + cloudOffset) % (this.ctx.canvas.width + 100)) - 50;
            const y = 50 + i * 30;
            this.drawCloud(x, y);
        }
    }
    
    // 雲の描画
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGGraphics;
}