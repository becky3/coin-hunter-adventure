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
            slime: 'slime.svg',
            bird: 'bird.svg'
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
        
        console.log(`🐾 敵SVGファイル読み込み開始: ${filename}`);
        
        const loadPromise = fetch(filename)
            .then(response => {
                console.log(`📡 敵SVG fetch応答: ${filename}, status: ${response.status}`);
                if (!response.ok) {
                    throw new Error(`敵SVGファイル読み込み失敗: ${filename} (Status: ${response.status})`);
                }
                return response.text();
            })
            .then(svgText => {
                console.log(`✅ 敵SVGテキスト取得成功: ${filename}, 長さ: ${svgText.length}`);
                this.svgCache.set(filename, svgText);
                this.loadPromises.delete(filename);
                // 画像もプリロード
                this.preloadImage(filename, svgText);
                return svgText;
            })
            .catch(error => {
                console.error(`❌ 敵SVGファイル読み込みエラー: ${filename}`, error);
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
            console.log(`✅ 敵画像キャッシュ完了: ${filename}`);
        };
        
        img.onerror = (error) => {
            console.error(`❌ 敵画像キャッシュエラー: ${filename}`, error);
        };
        
        img.src = dataUrl;
    }
    
    // SVGファイルの事前読み込み
    async preloadSVGs() {
        console.log('🎮 敵SVGファイル事前読み込み開始...');
        const promises = Object.values(this.svgFiles).map(filename => this.loadSVG(filename));
        
        try {
            await Promise.all(promises);
            console.log('✅ 全敵SVGファイル事前読み込み完了');
        } catch (error) {
            console.error('❌ 敵SVGファイル事前読み込み中にエラー:', error);
        }
    }
    
    // 敵キャラクター描画
    drawEnemy(type, x, y, width, height, animTimer = 0) {
        const filename = this.svgFiles[type];
        if (!filename) {
            console.warn(`未知の敵タイプ: ${type}`);
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
                console.error(`敵SVG描画エラー (${type}):`, error);
            });
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
            console.error(`❌ 敵画像作成エラー (${type}):`, error);
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