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
            coin: 'coin.svg',
            flag: 'flag.svg',
            spring: 'spring.svg'
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
            console.error(`🚫 CORS ERROR: ゲームがfile://プロトコルで開かれています`);
            console.error(`🚫 アイテムSVGファイルの読み込みができません: ${filename}`);
            console.error(`✅ SOLUTION: HTTPサーバーでアクセスしてください: http://localhost:8080/`);
            return null;
        }
        
        console.log(`💎 アイテムSVGファイル読み込み開始: ${filename}`);
        
        const loadPromise = fetch(filename)
            .then(response => {
                console.log(`📡 アイテムSVG fetch応答: ${filename}, status: ${response.status}`);
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
                console.log(`✅ アイテムSVGテキスト取得成功: ${filename}, 長さ: ${svgText.length}`);
                this.svgCache.set(filename, svgText);
                this.loadPromises.delete(filename);
                // 画像もプリロード
                this.preloadImage(filename, svgText);
                return svgText;
            })
            .catch(error => {
                console.error(`❌ アイテムSVGファイル読み込みエラー: ${filename}`, error);
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
            console.log(`✅ アイテム画像キャッシュ完了: ${filename}`);
        };
        
        img.onerror = (error) => {
            console.error(`❌ アイテム画像キャッシュエラー: ${filename}`, error);
        };
        
        img.src = dataUrl;
    }
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        console.log('🎮 アイテムSVGファイル事前読み込み開始...');
        const promises = Object.values(this.svgFiles).map(filename => this.loadSVG(filename));
        
        try {
            await Promise.all(promises);
            console.log('✅ 全アイテムSVGファイル事前読み込み完了');
        } catch (error) {
            console.error('❌ アイテムSVGファイル事前読み込み中にエラー:', error);
        }
    }
    
    // アイテム描画
    drawItem(type, x, y, width, height, animTimer = 0) {
        const filename = this.svgFiles[type];
        if (!filename) {
            console.warn(`未知のアイテムタイプ: ${type}`);
            return;
        }
        
        // 画像キャッシュから描画
        if (this.imageCache.has(filename)) {
            this.drawCachedImage(filename, x, y, width, height, type, animTimer);
        } else if (this.svgCache.has(filename)) {
            // SVGテキストはあるが画像がない場合は作成
            const svgText = this.svgCache.get(filename);
            this.createAndDrawImage(svgText, filename, x, y, width, height, type, animTimer);
        } else {
            // 何もない場合は読み込み開始（次フレームで描画される）
            this.loadSVG(filename).catch(error => {
                console.error(`アイテムSVG描画エラー (${type}):`, error);
            });
        }
    }
    
    // キャッシュされた画像を描画
    drawCachedImage(filename, x, y, width, height, type, animTimer) {
        const img = this.imageCache.get(filename);
        this.ctx.save();
        
        // アニメーション効果を適用
        if (type === 'coin') {
            // コインの回転効果
            const rotation = (animTimer * 0.05) % (Math.PI * 2);
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
            console.error(`❌ アイテム画像作成エラー (${type}):`, error);
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
}