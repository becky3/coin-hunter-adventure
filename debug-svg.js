// SVG読み込みデバッグスクリプト
console.log('SVG Debug Script Loaded');
console.log('現在のURL:', window.location.href);
console.log('Origin:', window.location.origin);

async function debugSVGLoading() {
    console.log('=== SVG読み込みデバッグ開始 ===');
    
    const svgFiles = [
        'player-idle.svg',
        'player-walk1.svg', 
        'player-jump.svg',
        'slime.svg'
    ];
    
    for (const filename of svgFiles) {
        console.log(`\n--- ${filename} の読み込みテスト ---`);
        
        try {
            console.log(`fetch開始: ${filename}`);
            const response = await fetch(filename);
            console.log(`fetch応答: status=${response.status}, ok=${response.ok}`);
            
            if (response.ok) {
                const text = await response.text();
                console.log(`✅ ${filename} 読み込み成功: ${text.length}文字`);
                console.log(`先頭100文字: ${text.substring(0, 100)}`);
            } else {
                console.error(`❌ ${filename} 読み込み失敗: HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ ${filename} fetch エラー:`, error);
            console.error(`エラータイプ: ${error.constructor.name}`);
            console.error(`エラーメッセージ: ${error.message}`);
        }
    }
    
    console.log('\n=== SVG読み込みデバッグ完了 ===');
}

// DOMContentLoadedで実行
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了 - SVGデバッグ開始');
    debugSVGLoading();
});