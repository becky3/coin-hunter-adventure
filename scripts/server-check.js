#!/usr/bin/env node

/**
 * HTTPサーバー診断ツール
 * サーバーの状態を確認し、問題がある場合は解決策を提案
 */

const http = require('http');
const { spawn } = require('child_process');

class ServerChecker {
    constructor() {
        this.port = 8080;
        this.host = 'localhost';
    }

    /**
     * HTTPサーバーの状態を確認
     */
    async checkServerStatus() {
        console.log('🔍 HTTPサーバーの診断を開始します...\n');
        
        // 1. ポートの使用状況を確認
        console.log('1️⃣ ポートの使用状況を確認中...');
        const portInUse = await this.checkPort();
        
        if (!portInUse) {
            console.log(`❌ ポート${this.port}は使用されていません`);
            console.log('\n💡 解決策:');
            console.log('以下のコマンドでHTTPサーバーを起動してください:');
            console.log('```bash');
            console.log('nohup python3 -m http.server 8080 > server.log 2>&1 &');
            console.log('```');
            return false;
        }
        
        console.log(`✅ ポート${this.port}は使用中です`);
        
        // 2. HTTPレスポンスを確認
        console.log('\n2️⃣ HTTPレスポンスを確認中...');
        const responseOk = await this.checkHttpResponse();
        
        if (!responseOk) {
            console.log('❌ HTTPサーバーが正しく応答していません');
            console.log('\n💡 解決策:');
            console.log('既存のサーバーを停止して新しく起動します:');
            console.log('```bash');
            console.log('pkill -f "python3 -m http.server"');
            console.log('nohup python3 -m http.server 8080 > server.log 2>&1 &');
            console.log('```');
            return false;
        }
        
        console.log('✅ HTTPサーバーは正常に応答しています');
        
        // 3. ファイルアクセスを確認
        console.log('\n3️⃣ ファイルアクセスを確認中...');
        const fileAccessOk = await this.checkFileAccess();
        
        if (!fileAccessOk) {
            console.log('❌ ファイルへのアクセスに問題があります');
            console.log('正しいディレクトリでサーバーが起動されているか確認してください');
            return false;
        }
        
        console.log('✅ ファイルアクセスは正常です');
        
        // 4. プロセス情報を取得
        console.log('\n4️⃣ サーバープロセス情報を取得中...');
        await this.getServerProcessInfo();
        
        console.log('\n✅ HTTPサーバーは正常に動作しています！');
        console.log(`🌐 アクセスURL: http://${this.host}:${this.port}/`);
        
        return true;
    }

    /**
     * ポートが使用中かチェック
     */
    async checkPort() {
        return new Promise((resolve) => {
            const server = http.createServer();
            
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true); // ポートは使用中
                } else {
                    resolve(false);
                }
            });
            
            server.once('listening', () => {
                server.close();
                resolve(false); // ポートは空いている
            });
            
            server.listen(this.port);
        });
    }

    /**
     * HTTPレスポンスをチェック
     */
    async checkHttpResponse() {
        return new Promise((resolve) => {
            const req = http.get(`http://${this.host}:${this.port}/`, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    /**
     * ファイルアクセスをチェック
     */
    async checkFileAccess() {
        return new Promise((resolve) => {
            const req = http.get(`http://${this.host}:${this.port}/index.html`, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    console.log(`  HTTPステータスコード: ${res.statusCode}`);
                    resolve(false);
                }
            });
            
            req.on('error', (err) => {
                console.log(`  エラー: ${err.message}`);
                resolve(false);
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    /**
     * サーバープロセス情報を取得
     */
    async getServerProcessInfo() {
        return new Promise((resolve) => {
            const ps = spawn('ps', ['aux']);
            const grep = spawn('grep', ['python3.*http.server']);
            const grepV = spawn('grep', ['-v', 'grep']);
            
            let output = '';
            
            ps.stdout.pipe(grep.stdin);
            grep.stdout.pipe(grepV.stdin);
            
            grepV.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            grepV.on('close', () => {
                if (output) {
                    console.log('  サーバープロセス情報:');
                    const lines = output.trim().split('\n');
                    lines.forEach(line => {
                        const parts = line.split(/\s+/);
                        if (parts.length > 1) {
                            console.log(`  PID: ${parts[1]}, 起動時刻: ${parts[8]}`);
                        }
                    });
                } else {
                    console.log('  Pythonサーバープロセスが見つかりません');
                }
                resolve();
            });
        });
    }

    /**
     * サーバーを自動起動（オプション）
     */
    async startServer() {
        console.log('\n🚀 HTTPサーバーを起動します...');
        
        const server = spawn('python3', ['-m', 'http.server', this.port], {
            detached: true,
            stdio: 'ignore'
        });
        
        server.unref();
        
        // 起動待機
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 起動確認
        const started = await this.checkHttpResponse();
        if (started) {
            console.log('✅ HTTPサーバーが正常に起動しました');
        } else {
            console.log('❌ HTTPサーバーの起動に失敗しました');
        }
        
        return started;
    }
}

// メイン処理
async function main() {
    const checker = new ServerChecker();
    
    const args = process.argv.slice(2);
    const autoStart = args.includes('--start');
    
    const isRunning = await checker.checkServerStatus();
    
    if (!isRunning && autoStart) {
        console.log('\n自動起動オプションが指定されています...');
        await checker.startServer();
    }
    
    process.exit(isRunning ? 0 : 1);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
});

// 実行
main().catch(error => {
    console.error('実行エラー:', error);
    process.exit(1);
});