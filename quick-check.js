// 簡易状況確認スクリプト
const http = require('http');

async function quickCheck() {
    console.log('🔍 現在の状況確認');
    
    // HTTPサーバー確認
    try {
        await new Promise((resolve, reject) => {
            const req = http.get('http://localhost:8080/', (res) => {
                console.log('✅ HTTPサーバー動作中');
                resolve();
            });
            req.on('error', reject);
            req.setTimeout(3000, () => reject(new Error('タイムアウト')));
        });
    } catch (error) {
        console.log('❌ HTTPサーバーが動いていません');
        console.log('   解決方法: python3 -m http.server 8080 を実行');
        return;
    }
    
    console.log('\n📋 次に確認してください:');
    console.log('1. ブラウザで http://localhost:8080/ を開く');
    console.log('2. F12キーを押して開発者ツールを開く');
    console.log('3. Consoleタブでエラーメッセージを確認');
    console.log('4. 画面の表示状況を確認');
    console.log('\n報告してください:');
    console.log('- コンソールに出るエラーメッセージ');
    console.log('- 画面に表示される内容');
    console.log('- ゲームが動くかどうか');
}

quickCheck();