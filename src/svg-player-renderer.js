/**
 * SVGファイルベースのプレイヤーレンダラー
 * 外部SVGファイルを読み込んでCanvas上に描画
 */

class SVGPlayerRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.svgCache = new Map(); // SVGファイルキャッシュ
        this.colorVariables = new Map(); // CSS変数キャッシュ
        this.isLoading = false;
        this.loadPromises = new Map();
        
        // デフォルト色設定
        this.defaultColors = {
            skin: '#F4C2A1',
            clothHealthy: '#6B8EC8',
            clothDamaged: '#E3A8C7',
            hatHealthy: '#8BC34A',
            hatDamaged: '#FFB74D',
            eye: '#2C2C2C',
            nose: '#E6967A',
            mouth: '#8B4513'
        };
    }
    
    // SVGファイルを非同期で読み込み
    async loadSVG(filename) {
        if (this.svgCache.has(filename)) {
            console.log(`🎯 キャッシュからSVG取得: ${filename}`);
            return this.svgCache.get(filename);
        }
        
        if (this.loadPromises.has(filename)) {
            console.log(`⏳ SVG読み込み中（待機）: ${filename}`);
            return this.loadPromises.get(filename);
        }
        
        // Protocol check for better error messages
        if (window.location.protocol === 'file:') {
            console.error(`🚫 CORS ERROR: ゲームがfile://プロトコルで開かれています`);
            console.error(`🚫 SVGファイルの読み込みができません: ${filename}`);
            console.error(`✅ SOLUTION: HTTPサーバーを起動してください`);
            console.error(`📝 例: python3 -m http.server 8080`);
            console.error(`📝 その後: http://localhost:8080/ でアクセス`);
            
            // Return null to trigger fallback rendering
            return null;
        }
        
        console.log(`🌐 SVGファイル読み込み開始: ${filename}`);
        console.log(`📍 現在のURL: ${window.location.href}`);
        console.log(`🎯 読み込み先: ${window.location.origin}/${filename}`);
        
        const loadPromise = fetch(filename)
            .then(response => {
                console.log(`📡 fetch応答: ${filename}, status: ${response.status}, ok: ${response.ok}`);
                console.log(`📡 response.url: ${response.url}`);
                console.log(`📡 response.type: ${response.type}`);
                if (!response.ok) {
                    if (response.status === 0) {
                        throw new Error(`CORS/ネットワークエラー: ${filename} - file://プロトコルまたはネットワーク問題 (Status: 0)`);
                    } else {
                        throw new Error(`SVGファイル読み込み失敗: ${filename} (Status: ${response.status})`);
                    }
                }
                return response.text();
            })
            .then(svgText => {
                console.log(`✅ SVGテキスト取得成功: ${filename}, 長さ: ${svgText.length}`);
                this.svgCache.set(filename, svgText);
                this.loadPromises.delete(filename);
                return svgText;
            })
            .catch(error => {
                console.error(`❌ SVG読み込みエラー詳細: ${filename}`, error);
                console.error(`❌ エラーメッセージ: ${error.message}`);
                console.error(`❌ エラータイプ: ${error.constructor.name}`);
                this.loadPromises.delete(filename);
                return null;
            });
        
        this.loadPromises.set(filename, loadPromise);
        return loadPromise;
    }
    
    // 健康状態に応じた色設定を取得
    getColorVariables(health) {
        const colors = this.defaultColors;
        const isHealthy = health === 2;
        
        return {
            '--skin-color': colors.skin,
            '--skin-light': this.lightenColor(colors.skin, 20),
            '--cloth-color': isHealthy ? colors.clothHealthy : colors.clothDamaged,
            '--cloth-color-dark': this.darkenColor(isHealthy ? colors.clothHealthy : colors.clothDamaged, 20),
            '--hat-color': isHealthy ? colors.hatHealthy : colors.hatDamaged,
            '--hat-color-dark': this.darkenColor(isHealthy ? colors.hatHealthy : colors.hatDamaged, 30),
            '--eye-color': colors.eye,
            '--nose-color': colors.nose,
            '--mouth-color': colors.mouth
        };
    }
    
    // SVGテキスト内のCSS変数を置換
    applyColorVariables(svgText, colorVars) {
        let processedSvg = svgText;
        
        Object.entries(colorVars).forEach(([varName, color]) => {
            // より正確な正規表現でCSS変数を置換
            const escapedVarName = varName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`var\\s*\\(\\s*${escapedVarName}\\s*(?:,\\s*[^)]*)?\\s*\\)`, 'g');
            processedSvg = processedSvg.replace(regex, color);
        });
        
        return processedSvg;
    }
    
    // アニメーション状態に基づいてSVGファイル名を決定
    getSVGFilename(velX, velY, animFrame) {
        const isMoving = Math.abs(velX) > 0.1;
        const isJumping = velY < -1;
        const isOnGround = velY >= -0.1 && velY <= 0.1;
        
        if (isJumping) {
            return '../assets/player-jump.svg';
        } else if (isMoving && isOnGround) {
            const walkFrame = Math.floor(animFrame / 15) % 2;
            return walkFrame === 0 ? '../assets/player-walk1.svg' : '../assets/player-walk2.svg';
        } else {
            return '../assets/player-idle.svg';
        }
    }
    
    // メインの描画メソッド（同期版）
    drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame, velX = 0, velY = 0) {
        const filename = this.getSVGFilename(velX, velY, animFrame);
        const colorVars = this.getColorVariables(health);
        
        console.log(`SVGプレイヤー描画: ${filename}, キャッシュ状況: ${this.svgCache.has(filename)}`);
        
        // SVGが利用可能な場合は使用、そうでなければエラー
        if (this.svgCache.has(filename)) {
            console.log(`SVG描画を使用: ${filename}`);
            this.drawFromSVGCache(x, y, width, height, health, direction, invulnerable, animFrame, filename);
        } else {
            throw new Error(`プレイヤーSVGファイル（${filename}）が読み込まれていません。HTTPサーバー経由でアクセスしてください。`);
        }
    }
    
    // SVGキャッシュから描画
    drawFromSVGCache(x, y, width, height, health, direction, invulnerable, animFrame, filename) {
        const svgText = this.svgCache.get(filename);
        if (!svgText) {
            throw new Error(`SVGファイル（${filename}）がキャッシュに存在しません`);
        }
        
        // SVGテキストを使って描画
        this.renderSVGToCanvasSync(svgText, x, y, width, height, health, direction, invulnerable, animFrame);
    }
    
    // SVGをCanvasに同期描画（キャッシュされた画像使用）
    renderSVGToCanvasSync(svgText, x, y, width, height, health, direction, invulnerable, animFrame) {
        const scale = health === 2 ? 1.0 : 0.85;
        const actualWidth = width * scale;
        const actualHeight = height * scale;
        const offsetY = health === 1 ? height * 0.15 : 0;
        
        // SVGキャッシュキーを生成
        const cacheKey = `${svgText}_${JSON.stringify(this.getColorVariables(health))}`;
        
        if (this.imageCache && this.imageCache.has(cacheKey)) {
            const img = this.imageCache.get(cacheKey);
            this.drawImageToCanvas(img, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame);
        } else {
            // SVGテキストがあるので直接同期描画
            console.log('SVGテキストから直接描画を試行');
            try {
                this.drawSVGDirectly(svgText, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame);
                // 成功したら画像もキャッシュ用に作成
                this.createAndCacheImage(svgText, cacheKey, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame);
            } catch (error) {
                console.error('SVG直接描画エラー:', error);
                this.drawFallback(x, y, width, height, health, direction, invulnerable);
            }
        }
    }
    
    // 画像をCanvasに描画
    drawImageToCanvas(img, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame) {
        this.ctx.save();
        
        // 無敵時間中の点滅
        if (invulnerable) {
            this.ctx.globalAlpha = animFrame % 8 < 4 ? 0.6 : 1.0;
        }
        
        // 向きによる反転と位置調整
        this.ctx.translate(x + actualWidth / 2, y + offsetY);
        if (direction < 0) {
            this.ctx.scale(-1, 1);
        }
        this.ctx.translate(-actualWidth / 2, 0);
        
        // SVG画像を描画
        this.ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
        
        this.ctx.restore();
    }
    
    // 画像を作成してキャッシュ
    createAndCacheImage(svgText, cacheKey, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame) {
        if (!this.imageCache) {
            this.imageCache = new Map();
        }
        
        // Base64エンコード
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        
        const img = new Image();
        img.onload = () => {
            this.imageCache.set(cacheKey, img);
            // 次のフレームで描画を試行
            this.drawImageToCanvas(img, x, y, actualWidth, actualHeight, offsetY, direction, invulnerable, animFrame);
        };
        
        img.onerror = (error) => {
            console.error('SVG画像の作成に失敗:', error);
        };
        
        img.src = dataUrl;
    }
    
    // SVGを直接描画（同期）
    drawSVGDirectly(svgText, x, y, width, height, offsetY, direction, invulnerable, animFrame) {
        // Base64エンコード
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        
        // 一時的な画像を作成して即座に描画
        const img = new Image();
        
        // 同期的に描画するためのハック
        img.onload = () => {
            this.ctx.save();
            
            // 無敵時間中の点滅
            if (invulnerable) {
                this.ctx.globalAlpha = animFrame % 8 < 4 ? 0.6 : 1.0;
            }
            
            // 向きの処理
            if (direction === -1) {
                this.ctx.scale(-1, 1);
                this.ctx.translate(-x - width, 0);
            }
            
            this.ctx.drawImage(img, x, y + offsetY, width, height);
            this.ctx.restore();
        };
        
        // 同期描画のため、src設定前にloadイベントを設定
        img.src = dataUrl;
        
        // 画像が即座に利用可能な場合の処理
        if (img.complete && img.naturalWidth > 0) {
            this.ctx.save();
            
            if (invulnerable) {
                this.ctx.globalAlpha = animFrame % 8 < 4 ? 0.6 : 1.0;
            }
            
            if (direction === -1) {
                this.ctx.scale(-1, 1);
                this.ctx.translate(-x - width, 0);
            }
            
            this.ctx.drawImage(img, x, y + offsetY, width, height);
            this.ctx.restore();
        }
    }
    
    // フォールバック描画（SVG読み込み失敗時）
    drawFallback(x, y, width, height, health, direction, invulnerable) {
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
        
        // シンプルな矩形で代替
        this.ctx.fillStyle = health === 2 ? '#6B8EC8' : '#E3A8C7';
        this.ctx.fillRect(0, actualHeight * 0.4, actualWidth, actualHeight * 0.6);
        
        this.ctx.fillStyle = '#F4C2A1';
        this.ctx.fillRect(actualWidth * 0.2, 0, actualWidth * 0.6, actualHeight * 0.5);
        
        this.ctx.restore();
    }
    
    // 色を明るくするヘルパー
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
    
    // 色を暗くするヘルパー
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
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        const svgFiles = [
            '../assets/player-idle.svg',
            '../assets/player-walk1.svg',
            '../assets/player-walk2.svg',
            '../assets/player-jump.svg'
        ];
        
        console.log('プレイヤーSVGファイルを事前読み込み中...');
        console.log('読み込み対象ファイル:', svgFiles);
        
        const loadPromises = svgFiles.map(async (filename) => {
            try {
                console.log(`${filename} 読み込み開始`);
                const result = await this.loadSVG(filename);
                console.log(`${filename} 読み込み結果:`, result ? '成功' : '失敗');
                return result;
            } catch (error) {
                console.error(`${filename} 読み込みエラー:`, error);
                throw error;
            }
        });
        
        try {
            const results = await Promise.all(loadPromises);
            console.log('プレイヤーSVGファイルの事前読み込み完了');
            console.log('キャッシュ状況:', Array.from(this.svgCache.keys()));
        } catch (error) {
            console.error('SVGファイルの事前読み込みでエラー:', error);
            throw error;
        }
    }
}

// ブラウザ環境用のグローバル設定
if (typeof window !== 'undefined') {
    window.SVGPlayerRenderer = SVGPlayerRenderer;
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SVGPlayerRenderer };
}