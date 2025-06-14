/**
 * SVGファイルベースの敵キャラクターレンダラー
 * 外部SVGファイルを読み込んでCanvas上に描画
 */

class SVGEnemyRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.svgCache = new Map();
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
        
        // キャッシュから即座に描画
        if (this.svgCache.has(filename)) {
            const svgText = this.svgCache.get(filename);
            this.renderSVG(svgText, x, y, width, height, type, animTimer);
        } else {
            // キャッシュがない場合は非同期で読み込み（次フレームで描画される）
            this.loadSVG(filename).catch(error => {
                console.error(`敵SVG描画エラー (${type}):`, error);
            });
        }
    }
    
    // SVGをCanvasに描画
    renderSVG(svgText, x, y, width, height, type, animTimer) {
        // アニメーション効果を適用
        if (type === 'slime') {
            // スライムのバウンス効果
            const bounce = Math.sin(animTimer * 0.1) * 2;
            y += bounce;
        }
        
        // CSS変数を適用したSVGを作成
        const processedSVG = this.applyCSSVariables(svgText, type, animTimer);
        
        // Base64エンコード
        const base64 = btoa(unescape(encodeURIComponent(processedSVG)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        
        // SVGをImageとして描画
        const img = new Image();
        
        img.onload = () => {
            this.ctx.save();
            
            // 鳥の羽ばたき効果
            if (type === 'bird') {
                const flapScale = 1 + Math.sin(animTimer * 0.3) * 0.05;
                this.ctx.translate(x + width / 2, y + height / 2);
                this.ctx.scale(1, flapScale);
                this.ctx.translate(-x - width / 2, -y - height / 2);
            }
            
            this.ctx.drawImage(img, x, y, width, height);
            this.ctx.restore();
        };
        
        img.onerror = (error) => {
            console.error(`❌ 敵SVG画像読み込みエラー (${type}):`, error);
        };
        
        img.src = dataUrl;
    }
    
    // CSS変数を適用
    applyCSSVariables(svgText, type, animTimer) {
        let processedSVG = svgText;
        
        if (type === 'slime') {
            // スライムの目の瞬き
            const eyeBlink = animTimer % 180 > 170 ? 0.3 : 1.0;
            processedSVG = processedSVG.replace(/var\(--eye-scale-y\)/g, eyeBlink);
        } else if (type === 'bird') {
            // 鳥の羽の色変化
            const wingPhase = Math.sin(animTimer * 0.1) * 0.5 + 0.5;
            const wingColor = this.interpolateColor('#FF7043', '#FFA726', wingPhase);
            processedSVG = processedSVG.replace(/var\(--wing-color\)/g, wingColor);
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