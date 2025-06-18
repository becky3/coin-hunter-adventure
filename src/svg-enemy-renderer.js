/**
 * SVGファイルベースの敵キャラクターレンダラー
 * 外部SVGファイルを読み込んでCanvas上に描画
 */

class SVGEnemyRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.svgCache = new Map();
        this.imageCache = new Map();
        this.loadPromises = new Map();
        
        // SVGファイルマップ
        this.svgFiles = {
            slime: '../assets/slime.svg',
            bird: '../assets/bird.svg'
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
        
        // Protocol check
        if (window.location.protocol === 'file:') {
            return null;
        }
        
        
        const loadPromise = fetch(filename)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 0) {
                        throw new Error(`CORS/ネットワークエラー: ${filename} - file://プロトコルまたはネットワーク問題 (Status: 0)`);
                    } else {
                        throw new Error(`敵SVGファイル読み込み失敗: ${filename} (Status: ${response.status})`);
                    }
                }
                return response.text();
            })
            .then(svgText => {
                this.svgCache.set(filename, svgText);
                this.loadPromises.delete(filename);
                // 画像もプリロード
                this.preloadImage(filename, svgText);
                return svgText;
            })
            .catch(error => {
                this.loadPromises.delete(filename);
                throw error;
            });
        
        this.loadPromises.set(filename, loadPromise);
        return loadPromise;
    }
    
    // SVG画像をプリロード
    preloadImage(filename, svgText) {
        const base64 = btoa(unescape(encodeURIComponent(svgText)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        const img = new Image();
        
        img.onload = () => {
            this.imageCache.set(filename, img);
        };
        
        img.onerror = (error) => {
        };
        
        img.src = dataUrl;
    }
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        const promises = Object.values(this.svgFiles).map(filename => this.loadSVG(filename));
        
        try {
            await Promise.all(promises);
        } catch (error) {
        }
    }
    
    // 敵キャラクター描画
    drawEnemy(type, x, y, width, height, animTimer = 0) {
        const filename = this.svgFiles[type];
        if (!filename) {
            return;
        }
        
        // SVGが利用可能な場合は使用、そうでなければエラー
        if (this.svgCache.has(filename)) {
            this.drawCachedImage(filename, x, y, width, height, type, animTimer);
        } else {
            throw new Error(`敵SVGファイル（${filename}）が読み込まれていません。HTTPサーバー経由でアクセスしてください。`);
        }
    }
    
    // キャッシュされた画像を描画
    drawCachedImage(filename, x, y, width, height, type, animTimer) {
        const img = this.imageCache.get(filename);
        this.ctx.save();
        
        // アニメーション効果を適用
        if (type === 'slime') {
            // スライムのバウンス効果
            const bounce = Math.sin(animTimer * 0.1) * 2;
            y += bounce;
        } else if (type === 'bird') {
            // 鳥の羽ばたき効果
            const flapScale = 1 + Math.sin(animTimer * 0.3) * 0.05;
            this.ctx.translate(x + width / 2, y + height / 2);
            this.ctx.scale(1, flapScale);
            this.ctx.translate(-x - width / 2, -y - height / 2);
        }
        
        this.ctx.drawImage(img, x, y, width, height);
        this.ctx.restore();
    }
    
    // 画像を作成して描画
    createAndDrawImage(svgText, filename, x, y, width, height, type, animTimer) {
        // CSS変数を適用
        const processedSVG = this.applyCSSVariables(svgText, type, animTimer);
        
        const base64 = btoa(unescape(encodeURIComponent(processedSVG)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        const img = new Image();
        
        img.onload = () => {
            // 次回用にキャッシュ
            this.imageCache.set(filename, img);
            // 即座に描画
            this.drawCachedImage(filename, x, y, width, height, type, animTimer);
        };
        
        img.onerror = (error) => {
        };
        
        img.src = dataUrl;
    }
    
    // CSS変数を適用
    applyCSSVariables(svgText, type, animTimer) {
        let processedSVG = svgText;
        
        if (type === 'slime') {
            // スライムの目の瞬き（SVG要素を直接変更）
            const eyeBlink = animTimer % 180 > 170;
            if (eyeBlink) {
                // 目を閉じる（楕円のry属性を小さくする）
                processedSVG = processedSVG.replace(/(<ellipse[^>]*cy="17\.5"[^>]*ry=")4"/g, '$10.5"');
            }
        } else if (type === 'bird') {
            // 鳥の羽の色変化はCSSフィルターやグラデーションで実装済み
        }
        
        return processedSVG;
    }
    
    // フォールバック描画
    drawEnemyFallback(type, x, y, width, height, animTimer) {
        if (type === 'slime') {
            this.drawSlimeFallback(x, y, width, height, animTimer);
        } else if (type === 'bird') {
            this.drawBirdFallback(x, y, width, height, animTimer);
        }
    }
    
    // スライムのフォールバック描画
    drawSlimeFallback(x, y, width, height, animTimer) {
        const bounce = Math.sin(animTimer * 0.1) * 2;
        this.ctx.save();
        this.ctx.translate(x, y + bounce);
        
        // 体
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.ellipse(width / 2, height * 0.7, width * 0.45, height * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 目
        const eyeBlink = animTimer % 180 > 170 ? 0.3 : 1.0;
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.38, height * 0.45, width * 0.08, width * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.ellipse(width * 0.62, height * 0.45, width * 0.08, width * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 瞳
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(width * 0.38, height * 0.47, width * 0.04, 0, Math.PI * 2);
        this.ctx.arc(width * 0.62, height * 0.47, width * 0.04, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 鳥のフォールバック描画
    drawBirdFallback(x, y, width, height, animTimer) {
        const flapOffset = Math.sin(animTimer * 0.3) * 5;
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // 体
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.5, height * 0.5, width * 0.3, height * 0.25, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 翼
        this.ctx.fillStyle = '#FF7F50';
        this.ctx.beginPath();
        this.ctx.ellipse(width * 0.2, height * 0.5 + flapOffset, width * 0.2, height * 0.15, -0.3, 0, Math.PI * 2);
        this.ctx.ellipse(width * 0.8, height * 0.5 - flapOffset, width * 0.2, height * 0.15, 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // 色の補間
    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    // HEXをRGBに変換
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}