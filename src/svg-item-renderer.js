/**
 * SVGファイルベースのアイテムレンダラー
 * 外部SVGファイルを読み込んでCanvas上に描画
 */

class SVGItemRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.svgCache = new Map();
        this.imageCache = new Map();
        this.loadPromises = new Map();
        
        // SVGファイルマップ
        this.svgFiles = {
            coin: '../assets/coin.svg',
            flag: '../assets/flag.svg',
            spring: '../assets/spring.svg'
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
        
        // Protocol check for better error messages
        if (window.location.protocol === 'file:') {
            return null;
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
                        throw new Error(`アイテムSVGファイル読み込み失敗: ${filename} (Status: ${response.status})`);
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
    
    // アイテム描画
    drawItem(type, x, y, width, height, animData = {}) {
        const animTimer = animData.rotation || animData.compression || 0;
        const filename = this.svgFiles[type];
        if (!filename) {
            return;
        }
        
        // SVGが利用可能な場合は使用、そうでなければエラー
        if (this.svgCache.has(filename)) {
            this.drawCachedImage(filename, x, y, width, height, type, animTimer);
        } else {
            throw new Error(`アイテムSVGファイル（${filename}）が読み込まれていません。HTTPサーバー経由でアクセスしてください。`);
        }
    }
    
    // キャッシュされた画像を描画
    drawCachedImage(filename, x, y, width, height, type, animTimer) {
        const img = this.imageCache.get(filename);
        this.ctx.save();
        
        // アニメーション効果を適用
        if (type === 'coin') {
            // コインの回転効果
            const rotation = animTimer % (Math.PI * 2);
            const scaleX = Math.cos(rotation);
            this.ctx.translate(x + width / 2, y + height / 2);
            this.ctx.scale(scaleX, 1);
            this.ctx.translate(-x - width / 2, -y - height / 2);
        } else if (type === 'flag') {
            // フラグのなびき効果
            const wave = Math.sin(animTimer * 0.1 + x * 0.01) * 2;
            y += wave;
        } else if (type === 'spring') {
            // スプリングの圧縮効果
            const compression = 1 - Math.abs(Math.sin(animTimer * 0.1)) * 0.1;
            this.ctx.translate(x + width / 2, y + height);
            this.ctx.scale(1, compression);
            this.ctx.translate(-x - width / 2, -y - height);
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
        
        if (type === 'coin') {
            // コインの輝き効果
            const shimmer = Math.sin(animTimer * 0.1) * 0.3 + 0.7;
            processedSVG = processedSVG.replace(/var\(--shimmer\)/g, shimmer);
        } else if (type === 'flag') {
            // フラグの波打ち
            const waveOffset = animTimer * 0.05;
            processedSVG = processedSVG.replace(/var\(--wave-offset\)/g, waveOffset);
        }
        
        return processedSVG;
    }
    
    // フォールバック描画
    drawItemFallback(type, x, y, width, height, animTimer) {
        if (type === 'coin') {
            this.drawCoinFallback(x, y, width, height, animTimer);
        } else if (type === 'flag') {
            this.drawFlagFallback(x, y, width, height);
        } else if (type === 'spring') {
            this.drawSpringFallback(x, y, width, height);
        }
    }
    
    // コインのフォールバック描画
    drawCoinFallback(x, y, width, height, animTimer) {
        const rotation = animTimer % (Math.PI * 2);
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.scale(Math.cos(rotation), 1);
        
        // コイン
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, width * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 縁
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 中央の記号
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.font = `bold ${width * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('¢', 0, 0);
        
        this.ctx.restore();
    }
    
    // フラグのフォールバック描画
    drawFlagFallback(x, y, width, height) {
        // ポール
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + width * 0.47, y, width * 0.06, height);
        
        // 旗
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.5, y);
        this.ctx.lineTo(x + width * 0.9, y + height * 0.15);
        this.ctx.lineTo(x + width * 0.85, y + height * 0.3);
        this.ctx.lineTo(x + width * 0.5, y + height * 0.4);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // スプリングのフォールバック描画
    drawSpringFallback(x, y, width, height) {
        // ベース
        this.ctx.fillStyle = '#696969';
        this.ctx.fillRect(x + width * 0.2, y + height * 0.8, width * 0.6, height * 0.2);
        
        // スプリング
        this.ctx.strokeStyle = '#C0C0C0';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const yPos = y + height * 0.8 - i * height * 0.15;
            this.ctx.moveTo(x + width * 0.25, yPos);
            this.ctx.lineTo(x + width * 0.75, yPos - height * 0.05);
        }
        this.ctx.stroke();
    }
}