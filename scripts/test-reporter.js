#!/usr/bin/env node

/**
 * 統一テストレポート生成ツール
 * unified-test-results.jsonを読み込んで、見やすいレポートを生成
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
    constructor() {
        this.resultsPath = path.join(process.cwd(), 'unified-test-results.json');
        this.reportsDir = path.join(process.cwd(), 'test-reports');
        this.results = null;
    }

    /**
     * レポート生成のメインメソッド
     */
    async generate() {
        try {
            // 結果ファイルの読み込み
            this.loadResults();

            // レポートディレクトリの作成
            this.ensureReportsDirectory();

            // 各形式でレポート生成
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Markdownレポート
            const markdownContent = this.generateMarkdownReport();
            const markdownPath = path.join(this.reportsDir, `${timestamp}.md`);
            const latestMarkdownPath = path.join(this.reportsDir, 'latest.md');
            
            fs.writeFileSync(markdownPath, markdownContent);
            fs.writeFileSync(latestMarkdownPath, markdownContent);
            
            console.log(`📝 Markdownレポートを生成しました: ${markdownPath}`);
            
            // HTMLレポート
            const htmlContent = this.generateHTMLReport();
            const htmlPath = path.join(this.reportsDir, `${timestamp}.html`);
            const latestHtmlPath = path.join(this.reportsDir, 'latest.html');
            
            fs.writeFileSync(htmlPath, htmlContent);
            fs.writeFileSync(latestHtmlPath, htmlContent);
            
            console.log(`🌐 HTMLレポートを生成しました: ${htmlPath}`);
            
            // コンソールサマリー
            this.printConsoleSummary();
            
            return {
                markdown: markdownPath,
                html: htmlPath,
                timestamp
            };
            
        } catch (error) {
            console.error('❌ レポート生成中にエラーが発生しました:', error.message);
            process.exit(1);
        }
    }

    /**
     * 結果ファイルの読み込み
     */
    loadResults() {
        if (!fs.existsSync(this.resultsPath)) {
            throw new Error(`テスト結果ファイルが見つかりません: ${this.resultsPath}`);
        }
        
        const content = fs.readFileSync(this.resultsPath, 'utf8');
        this.results = JSON.parse(content);
    }

    /**
     * レポートディレクトリの作成
     */
    ensureReportsDirectory() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    /**
     * Markdownレポートの生成
     */
    generateMarkdownReport() {
        const { timestamp, environment, tests, summary } = this.results;
        const testDate = new Date(timestamp);
        
        let markdown = [];
        
        // ヘッダー
        markdown.push('# 統合テスト実行レポート');
        markdown.push('');
        markdown.push(`**実行日時**: ${testDate.toLocaleString('ja-JP')}`);
        markdown.push(`**環境**: ${environment.node} on ${environment.platform}`);
        markdown.push(`**作業ディレクトリ**: ${environment.cwd}`);
        markdown.push('');
        
        // サマリー
        markdown.push('## 📊 サマリー');
        markdown.push('');
        markdown.push('| 項目 | 値 |');
        markdown.push('|------|-----|');
        markdown.push(`| 総テスト数 | ${summary.total} |`);
        markdown.push(`| ✅ 成功 | ${summary.passed} |`);
        markdown.push(`| ❌ 失敗 | ${summary.failed} |`);
        markdown.push(`| ⏭️ スキップ | ${summary.skipped} |`);
        markdown.push(`| 成功率 | ${summary.successRate}% |`);
        markdown.push(`| 実行時間 | ${(summary.duration / 1000).toFixed(2)}秒 |`);
        markdown.push('');
        
        // カテゴリ別結果
        markdown.push('## 📋 カテゴリ別結果');
        markdown.push('');
        
        const categories = [
            { key: 'structure', name: '構造テスト', icon: '📁' },
            { key: 'http', name: 'HTTPサーバーテスト', icon: '🌐' },
            { key: 'integration', name: '統合テスト', icon: '🔗' },
            { key: 'automated', name: '自動ゲームテスト', icon: '🎮' },
            { key: 'level', name: 'レベル検証テスト', icon: '🏗️' }
        ];
        
        categories.forEach(category => {
            const result = tests[category.key];
            if (!result) return;
            
            markdown.push(`### ${category.icon} ${category.name}`);
            markdown.push('');
            
            if (category.key === 'http') {
                // HTTPサーバーテストの特別処理
                const status = result.serverRunning ? '✅ 起動中' : '❌ 停止中';
                markdown.push(`- HTTPサーバー: ${status}`);
                markdown.push(`- 成功: ${result.passed}`);
                markdown.push(`- 失敗: ${result.failed}`);
            } else if (result.tests && Array.isArray(result.tests)) {
                // 構造テストやレベル検証テストなど
                markdown.push(`**結果**: ${result.passed}/${result.tests.length} 成功`);
                markdown.push('');
                
                if (result.tests.length > 0) {
                    markdown.push('<details>');
                    markdown.push('<summary>詳細を表示</summary>');
                    markdown.push('');
                    
                    result.tests.forEach(test => {
                        const icon = test.passed ? '✅' : '❌';
                        markdown.push(`- ${icon} ${test.name}`);
                        if (!test.passed && test.message) {
                            markdown.push(`  - エラー: ${test.message}`);
                        }
                    });
                    
                    markdown.push('');
                    markdown.push('</details>');
                }
            } else if (result.output) {
                // 統合テストや自動ゲームテストなど
                const successLine = result.output.match(/成功[：:]\s*(\d+)/);
                const failLine = result.output.match(/失敗[：:]\s*(\d+)/);
                
                if (successLine || failLine) {
                    const passed = successLine ? parseInt(successLine[1]) : result.passed || 0;
                    const failed = failLine ? parseInt(failLine[1]) : result.failed || 0;
                    markdown.push(`**結果**: ${passed}/${passed + failed} 成功`);
                } else {
                    markdown.push(`**結果**: 実行完了`);
                }
                
                if (result.exitCode !== 0) {
                    markdown.push(`**終了コード**: ${result.exitCode} ⚠️`);
                }
            }
            
            markdown.push('');
        });
        
        // 失敗したテストの詳細
        if (summary.failed > 0) {
            markdown.push('## ❌ 失敗したテスト');
            markdown.push('');
            
            categories.forEach(category => {
                const result = tests[category.key];
                if (!result || !result.tests) return;
                
                const failedTests = result.tests.filter(t => !t.passed);
                if (failedTests.length > 0) {
                    markdown.push(`### ${category.name}`);
                    markdown.push('');
                    failedTests.forEach(test => {
                        markdown.push(`- **${test.name}**`);
                        if (test.message) {
                            markdown.push(`  - ${test.message}`);
                        }
                    });
                    markdown.push('');
                }
            });
        }
        
        // フッター
        markdown.push('---');
        markdown.push('');
        markdown.push('*このレポートは統合テストランナーによって自動生成されました*');
        
        return markdown.join('\n');
    }

    /**
     * HTMLレポートの生成
     */
    generateHTMLReport() {
        const { timestamp, environment, tests, summary } = this.results;
        const testDate = new Date(timestamp);
        
        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>統合テストレポート - ${testDate.toLocaleString('ja-JP')}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header h1 {
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
        }
        
        .header .meta {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .summary-card .value {
            font-size: 2rem;
            font-weight: bold;
            margin: 0.5rem 0;
        }
        
        .summary-card .label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .summary-card.success { border-top: 4px solid #4CAF50; }
        .summary-card.failure { border-top: 4px solid #f44336; }
        .summary-card.skip { border-top: 4px solid #FF9800; }
        .summary-card.rate { border-top: 4px solid #2196F3; }
        .summary-card.time { border-top: 4px solid #9C27B0; }
        
        .category {
            background: white;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .category-header {
            background: #f8f9fa;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .category-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
        }
        
        .category-content {
            padding: 1.5rem;
        }
        
        .test-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .test-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            align-items: center;
        }
        
        .test-item:last-child {
            border-bottom: none;
        }
        
        .test-icon {
            margin-right: 0.5rem;
            font-size: 1.2rem;
        }
        
        .test-name {
            flex: 1;
        }
        
        .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .badge.success {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .badge.failure {
            background: #ffebee;
            color: #c62828;
        }
        
        .footer {
            text-align: center;
            color: #666;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #e0e0e0;
        }
        
        details {
            margin-top: 1rem;
        }
        
        summary {
            cursor: pointer;
            color: #667eea;
            font-weight: 500;
        }
        
        summary:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 統合テストレポート</h1>
        <div class="meta">
            <div>実行日時: ${testDate.toLocaleString('ja-JP')}</div>
            <div>環境: ${environment.node} on ${environment.platform}</div>
            <div>作業ディレクトリ: ${environment.cwd}</div>
        </div>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <div class="label">総テスト数</div>
            <div class="value">${summary.total}</div>
        </div>
        <div class="summary-card success">
            <div class="label">成功</div>
            <div class="value">${summary.passed}</div>
        </div>
        <div class="summary-card failure">
            <div class="label">失敗</div>
            <div class="value">${summary.failed}</div>
        </div>
        <div class="summary-card skip">
            <div class="label">スキップ</div>
            <div class="value">${summary.skipped}</div>
        </div>
        <div class="summary-card rate">
            <div class="label">成功率</div>
            <div class="value">${summary.successRate}%</div>
        </div>
        <div class="summary-card time">
            <div class="label">実行時間</div>
            <div class="value">${(summary.duration / 1000).toFixed(1)}秒</div>
        </div>
    </div>
    
    ${this.generateHTMLCategories()}
    
    <div class="footer">
        <p>このレポートは統合テストランナーによって自動生成されました</p>
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
    </div>
</body>
</html>`;
        
        return html;
    }

    /**
     * HTMLのカテゴリセクションを生成
     */
    generateHTMLCategories() {
        const { tests } = this.results;
        const categories = [
            { key: 'structure', name: '構造テスト', icon: '📁' },
            { key: 'http', name: 'HTTPサーバーテスト', icon: '🌐' },
            { key: 'integration', name: '統合テスト', icon: '🔗' },
            { key: 'automated', name: '自動ゲームテスト', icon: '🎮' },
            { key: 'level', name: 'レベル検証テスト', icon: '🏗️' }
        ];
        
        return categories.map(category => {
            const result = tests[category.key];
            if (!result) return '';
            
            let content = '';
            let badge = '';
            
            if (category.key === 'http') {
                const status = result.serverRunning ? '✅ 起動中' : '❌ 停止中';
                content = `<p>HTTPサーバー: ${status}</p>`;
                badge = result.serverRunning ? 
                    '<span class="badge success">成功</span>' : 
                    '<span class="badge failure">失敗</span>';
            } else if (result.tests && Array.isArray(result.tests)) {
                const passed = result.tests.filter(t => t.passed).length;
                const total = result.tests.length;
                
                badge = `<span class="badge ${passed === total ? 'success' : 'failure'}">${passed}/${total}</span>`;
                
                if (total > 0) {
                    content = `
                        <details>
                            <summary>テスト詳細を表示</summary>
                            <ul class="test-list">
                                ${result.tests.map(test => `
                                    <li class="test-item">
                                        <span class="test-icon">${test.passed ? '✅' : '❌'}</span>
                                        <span class="test-name">${test.name}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </details>
                    `;
                }
            } else if (result.output) {
                const successLine = result.output.match(/成功[：:]\s*(\d+)/);
                const failLine = result.output.match(/失敗[：:]\s*(\d+)/);
                
                if (successLine || failLine) {
                    const passed = successLine ? parseInt(successLine[1]) : result.passed || 0;
                    const failed = failLine ? parseInt(failLine[1]) : result.failed || 0;
                    const total = passed + failed;
                    badge = `<span class="badge ${failed === 0 ? 'success' : 'failure'}">${passed}/${total}</span>`;
                } else {
                    badge = '<span class="badge success">完了</span>';
                }
                
                content = `<p>テストが正常に実行されました。</p>`;
            }
            
            return `
                <div class="category">
                    <div class="category-header">
                        <h2 class="category-title">${category.icon} ${category.name}</h2>
                        ${badge}
                    </div>
                    <div class="category-content">
                        ${content}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * コンソールサマリーの表示
     */
    printConsoleSummary() {
        const { summary } = this.results;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 テストレポート生成完了');
        console.log('='.repeat(60));
        console.log(`総テスト数: ${summary.total}`);
        console.log(`✅ 成功: ${summary.passed} (${summary.successRate}%)`);
        console.log(`❌ 失敗: ${summary.failed}`);
        console.log(`⏭️  スキップ: ${summary.skipped}`);
        console.log(`⏱️  実行時間: ${(summary.duration / 1000).toFixed(2)}秒`);
        console.log('='.repeat(60));
    }
}

// メイン処理
if (require.main === module) {
    const reporter = new TestReporter();
    reporter.generate()
        .then(result => {
            console.log('\n✅ レポート生成が完了しました');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ エラー:', error.message);
            process.exit(1);
        });
}

module.exports = TestReporter;