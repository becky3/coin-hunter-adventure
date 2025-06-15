/**
 * 統合SVGレンダラー - 全ゲームオブジェクト対応
 * 外部SVGファイルを読み込んでCanvas上に描画
 */

class SVGRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.svgCache = new Map(); // SVGファイルキャッシュ
        this.imageCache = new Map(); // 画像キャッシュ
        this.loadPromises = new Map();
        
        // SVGファイルマッピング
        this.svgFiles = {
            player: {
                idle: '../assets/player-idle.svg',
                walk1: '../assets/player-walk1.svg',
                walk2: '../assets/player-walk2.svg',
                jump: '../assets/player-jump.svg'
            },
            enemies: {
                slime: '../assets/slime.svg',
                bird: '../assets/bird.svg'
            },
            objects: {
                coin: '../assets/coin.svg',
                flag: '../assets/flag.svg',
                spring: '../assets/spring.svg'
            }
        };
        
        // デフォルト色設定
        this.defaultColors = {
            player: {
                skin: '#F4C2A1',
                clothHealthy: '#6B8EC8',
                clothDamaged: '#E3A8C7',
                hatHealthy: '#8BC34A',
                hatDamaged: '#FFB74D',
                eye: '#2C2C2C',
                nose: '#E6967A',
                mouth: '#8B4513'
            }
        };
    }
    
    // SVGファイルを非同期で読み込み
    async loadSVG(filename) {
        if (this.svgCache.has(filename)) {
            return this.svgCache.get(filename);
        }
        
        if (this.loadPromises.has(filename)) {
            return this.loadPromises.get(filename);
        }
        
        const loadPromise = fetch(filename)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`SVGファイル読み込み失敗: ${filename}`);
                }
                return response.text();
            })
            .then(svgText => {
                this.svgCache.set(filename, svgText);
                this.loadPromises.delete(filename);
                return svgText;
            })
            .catch(error => {
                console.error(error);
                this.loadPromises.delete(filename);
                return null;
            });
        
        this.loadPromises.set(filename, loadPromise);
        return loadPromise;
    }
    
    // プレイヤー描画
    drawPlayer(x, y, width, height, health, direction, invulnerable, animFrame, velX = 0, velY = 0) {
        const filename = this.getPlayerSVGFilename(velX, velY, animFrame);
        const colorVars = this.getPlayerColorVariables(health);
        
        this.renderSVG(filename, x, y, width, height, {
            colorVars,
            health,
            direction,
            invulnerable,
            animFrame,
            scale: health === 2 ? 1.0 : 0.85,
            offsetY: health === 1 ? height * 0.15 : 0
        });
    }
    
    // 敵描画
    drawEnemy(type, x, y, width, height, animTimer, direction = 1) {
        const filename = this.svgFiles.enemies[type];
        if (!filename) {
            console.warn(`未対応の敵タイプ: ${type}`);
            return;
        }
        
        this.renderSVG(filename, x, y, width, height, {
            direction,
            animTimer
        });
    }
    
    // コイン描画
    drawCoin(x, y, width, height, rotation = 0) {
        const filename = this.svgFiles.objects.coin;
        
        this.renderSVG(filename, x, y, width, height, {
            rotation,
            transform: `rotate(${rotation}rad)`
        });
    }
    
    // フラグ描画
    drawFlag(x, y, width, height) {
        const filename = this.svgFiles.objects.flag;
        
        this.renderSVG(filename, x, y, width, height);
    }
    
    // スプリング描画
    drawSpring(x, y, width, height, compression = 0) {
        const filename = this.svgFiles.objects.spring;
        
        this.renderSVG(filename, x, y, width, height, {
            compression,
            compressed: compression > 0
        });
    }
    
    // 汎用SVG描画メソッド
    renderSVG(filename, x, y, width, height, options = {}) {
        if (this.svgCache.has(filename)) {
            const svgText = this.svgCache.get(filename);
            let processedSvg = svgText;
            
            // カラー変数の適用
            if (options.colorVars) {
                processedSvg = this.applyColorVariables(processedSvg, options.colorVars);
            }
            
            // CSS クラスの追加（圧縮状態など）
            if (options.compressed) {
                processedSvg = processedSvg.replace('<svg', '<svg class="compressed"');
            }
            
            this.renderSVGToCanvas(processedSvg, x, y, width, height, options);
        } else {
            // SVGが読み込まれていない場合はフォールバック
            this.drawFallback(filename, x, y, width, height, options);
            
            // 非同期で読み込み開始
            this.loadSVG(filename).catch(error => {
                console.warn(`SVG読み込みエラー: ${filename}`, error);
            });
        }
    }
    
    // SVGをCanvasに描画
    renderSVGToCanvas(svgText, x, y, width, height, options = {}) {
        const scale = options.scale || 1.0;
        const actualWidth = width * scale;
        const actualHeight = height * scale;
        const offsetY = options.offsetY || 0;
        
        // SVGキャッシュキーを生成
        const cacheKey = `${svgText}_${JSON.stringify(options)}`;
        
        if (this.imageCache.has(cacheKey)) {
            const img = this.imageCache.get(cacheKey);
            this.drawImageToCanvas(img, x, y, actualWidth, actualHeight, options);
        } else {
            // 画像キャッシュがない場合は非同期で作成
            this.createAndCacheImage(svgText, cacheKey, x, y, actualWidth, actualHeight, options);
        }
    }
    
    // 画像をCanvasに描画
    drawImageToCanvas(img, x, y, actualWidth, actualHeight, options = {}) {
        this.ctx.save();
        
        // 無敵時間中の点滅
        if (options.invulnerable && options.animFrame) {
            this.ctx.globalAlpha = options.animFrame % 8 < 4 ? 0.6 : 1.0;
        }
        
        // 変形と位置調整
        this.ctx.translate(x + actualWidth / 2, y + (options.offsetY || 0));
        
        // 向きによる反転
        if (options.direction && options.direction < 0) {
            this.ctx.scale(-1, 1);
        }
        
        // 回転
        if (options.rotation) {
            this.ctx.rotate(options.rotation);
        }
        
        this.ctx.translate(-actualWidth / 2, 0);
        
        // SVG画像を描画
        this.ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
        
        this.ctx.restore();
    }
    
    // 画像を作成してキャッシュ
    createAndCacheImage(svgText, cacheKey, x, y, actualWidth, actualHeight, options) {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            this.imageCache.set(cacheKey, img);
            URL.revokeObjectURL(url);
            // 読み込み完了後に再描画
            this.drawImageToCanvas(img, x, y, actualWidth, actualHeight, options);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            console.error('SVG画像の作成に失敗');
        };
        
        img.src = url;
    }
    
    // プレイヤーのSVGファイル名決定
    getPlayerSVGFilename(velX, velY, animFrame) {
        const isMoving = Math.abs(velX) > 0.1;
        const isJumping = velY < -1;
        const isOnGround = velY >= -0.1 && velY <= 0.1;
        
        if (isJumping) {
            return this.svgFiles.player.jump;
        } else if (isMoving && isOnGround) {
            const walkFrame = Math.floor(animFrame / 15) % 2;
            return walkFrame === 0 ? this.svgFiles.player.walk1 : this.svgFiles.player.walk2;
        } else {
            return this.svgFiles.player.idle;
        }
    }
    
    // プレイヤーの色設定取得
    getPlayerColorVariables(health) {
        const colors = this.defaultColors.player;
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
            const regex = new RegExp(`var\\\\(${varName}\\\\)`, 'g');
            processedSvg = processedSvg.replace(regex, color);
        });
        
        return processedSvg;
    }
    
    // フォールバック描画
    drawFallback(filename, x, y, width, height, options = {}) {
        this.ctx.save();
        
        // 基本的な矩形で代替
        if (filename.includes('player')) {
            const health = options.health || 2;
            this.ctx.fillStyle = health === 2 ? '#6B8EC8' : '#E3A8C7';
            this.ctx.fillRect(x, y + height * 0.4, width, height * 0.6);
            this.ctx.fillStyle = '#F4C2A1';
            this.ctx.fillRect(x + width * 0.2, y, width * 0.6, height * 0.5);
        } else if (filename.includes('slime')) {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.ellipse(x + width / 2, y + height * 0.7, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (filename.includes('bird')) {
            this.ctx.fillStyle = '#9C27B0';
            this.ctx.beginPath();
            this.ctx.ellipse(x + width / 2, y + height / 2, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (filename.includes('coin')) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(x + width / 2, y + height / 2, width * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (filename.includes('flag')) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x + width * 0.47, y, width * 0.06, height);
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(x + width * 0.5, y, width * 0.4, height * 0.5);
        } else if (filename.includes('spring')) {
            this.ctx.fillStyle = '#888888';
            this.ctx.fillRect(x + width * 0.2, y + height * 0.9, width * 0.6, height * 0.1);
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(x + width * 0.3, y + height * 0.2);
            this.ctx.lineTo(x + width * 0.7, y + height * 0.8);
            this.ctx.stroke();
        }
        
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
    
    // 全SVGファイルの事前読み込み
    async preloadAllSVGs() {
        const allFiles = [
            ...Object.values(this.svgFiles.player),
            ...Object.values(this.svgFiles.enemies),
            ...Object.values(this.svgFiles.objects)
        ];
        
        console.log('全SVGファイルを事前読み込み中...');
        
        const loadPromises = allFiles.map(filename => this.loadSVG(filename));
        
        try {
            await Promise.all(loadPromises);
            console.log('全SVGファイルの事前読み込み完了');
        } catch (error) {
            console.error('SVGファイルの事前読み込みでエラー:', error);
        }
    }
}

// ブラウザ環境用のグローバル設定
if (typeof window !== 'undefined') {
    window.SVGRenderer = SVGRenderer;
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SVGRenderer };
}