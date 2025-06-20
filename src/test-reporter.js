/**
 * テストレポーター
 * 様々な形式でテスト結果を出力
 */

class TestReporter {
    constructor() {
        this.formats = ['console', 'json', 'markdown', 'junit'];
        this.results = null;
    }

    // レポートの生成
    generateReport(results, format = 'console') {
        this.results = results;
        
        switch (format) {
            case 'console':
                return this.consoleReport();
            case 'json':
                return this.jsonReport();
            case 'markdown':
                return this.markdownReport();
            case 'junit':
                return this.junitReport();
            default:
                throw new Error(`Unknown format: ${format}`);
        }
    }

    // コンソール形式
    consoleReport() {
        const { summary, details } = this.results;
        let output = [];
        
        output.push('🧪 自動ゲームテスト結果');
        output.push('=' .repeat(50));
        output.push(`📊 サマリー: ${summary.passed}/${summary.total} 成功 (${summary.successRate})`);
        output.push(`⏱️  実行時間: ${summary.duration}`);
        output.push('');
        
        // カテゴリ別に集計
        const categories = {};
        details.forEach(test => {
            const category = test.name.split(':')[0] || 'その他';
            if (!categories[category]) {
                categories[category] = { passed: 0, failed: 0, tests: [] };
            }
            categories[category].tests.push(test);
            if (test.passed) {
                categories[category].passed++;
            } else {
                categories[category].failed++;
            }
        });
        
        // カテゴリ別結果
        Object.keys(categories).forEach(category => {
            const cat = categories[category];
            const icon = cat.failed === 0 ? '✅' : '❌';
            output.push(`${icon} ${category} (${cat.passed}/${cat.tests.length})`);
            
            cat.tests.forEach(test => {
                const testIcon = test.passed ? '✓' : '✗';
                const testName = test.name.split(':').slice(1).join(':').trim() || test.name;
                output.push(`  ${testIcon} ${testName} (${test.duration}ms)`);
                
                if (!test.passed && test.error) {
                    output.push(`     → ${test.error}`);
                }
            });
            output.push('');
        });
        
        return output.join('\n');
    }

    // JSON形式
    jsonReport() {
        return JSON.stringify(this.results, null, 2);
    }

    // Markdown形式
    markdownReport() {
        const { summary, details } = this.results;
        let output = [];
        
        output.push('# 🧪 自動ゲームテスト結果');
        output.push('');
        output.push('## 📊 サマリー');
        output.push('');
        output.push('| 項目 | 値 |');
        output.push('|------|-----|');
        output.push(`| 総テスト数 | ${summary.total} |`);
        output.push(`| 成功 | ${summary.passed} |`);
        output.push(`| 失敗 | ${summary.failed} |`);
        output.push(`| 成功率 | ${summary.successRate} |`);
        output.push(`| 実行時間 | ${summary.duration} |`);
        output.push(`| 実行日時 | ${new Date(this.results.timestamp).toLocaleString()} |`);
        output.push('');
        
        // テスト詳細
        output.push('## 📝 テスト詳細');
        output.push('');
        
        if (summary.failed > 0) {
            output.push('### ❌ 失敗したテスト');
            output.push('');
            details.filter(t => !t.passed).forEach(test => {
                output.push(`- **${test.name}** (${test.duration}ms)`);
                output.push(`  - エラー: ${test.error}`);
                output.push('');
            });
        }
        
        output.push('### ✅ 成功したテスト');
        output.push('');
        details.filter(t => t.passed).forEach(test => {
            output.push(`- ${test.name} (${test.duration}ms)`);
        });
        
        // 詳細統計
        if (this.results.statistics) {
            output.push('');
            output.push('## 📈 詳細統計');
            output.push('');
            output.push('```json');
            output.push(JSON.stringify(this.results.statistics, null, 2));
            output.push('```');
        }
        
        return output.join('\n');
    }

    // JUnit XML形式（CI/CD用）
    junitReport() {
        const { summary, details } = this.results;
        let xml = [];
        
        xml.push('<?xml version="1.0" encoding="UTF-8"?>');
        xml.push(`<testsuites name="Coin Hunter Adventure Tests" tests="${summary.total}" failures="${summary.failed}" time="${summary.duration}">`);
        xml.push('  <testsuite name="Automated Game Tests" tests="${summary.total}" failures="${summary.failed}">');
        
        details.forEach(test => {
            const time = (test.duration / 1000).toFixed(3);
            xml.push(`    <testcase name="${this.escapeXml(test.name)}" time="${time}">`);
            
            if (!test.passed) {
                xml.push(`      <failure message="${this.escapeXml(test.error || 'Unknown error')}">`);
                if (test.details && test.details.stack) {
                    xml.push(this.escapeXml(test.details.stack));
                }
                xml.push('      </failure>');
            }
            
            xml.push('    </testcase>');
        });
        
        xml.push('  </testsuite>');
        xml.push('</testsuites>');
        
        return xml.join('\n');
    }

    // XMLエスケープ
    escapeXml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // ファイルへの保存
    saveToFile(format, filename) {
        const fs = require('fs');
        const content = this.generateReport(this.results, format);
        fs.writeFileSync(filename, content);
        return filename;
    }

    // 複数フォーマットで保存
    saveAllFormats(baseDir = '.') {
        const fs = require('fs');
        const path = require('path');
        
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const files = {};
        
        this.formats.forEach(format => {
            let ext;
            switch (format) {
                case 'json': ext = 'json'; break;
                case 'markdown': ext = 'md'; break;
                case 'junit': ext = 'xml'; break;
                default: ext = 'txt';
            }
            
            const filename = path.join(baseDir, `test-report-${timestamp}.${ext}`);
            this.saveToFile(format, filename);
            files[format] = filename;
        });
        
        return files;
    }

    // GitHub Actions用の出力
    githubActionsOutput() {
        const { summary } = this.results;
        const output = [];
        
        if (summary.failed > 0) {
            output.push(`::error::${summary.failed} tests failed out of ${summary.total}`);
            
            this.results.details.filter(t => !t.passed).forEach(test => {
                output.push(`::error file=tests::${test.name}: ${test.error}`);
            });
        } else {
            output.push(`::notice::All ${summary.total} tests passed! 🎉`);
        }
        
        // サマリーをGitHub Actionsの出力変数として設定
        output.push(`::set-output name=total-tests::${summary.total}`);
        output.push(`::set-output name=passed-tests::${summary.passed}`);
        output.push(`::set-output name=failed-tests::${summary.failed}`);
        output.push(`::set-output name=success-rate::${summary.successRate}`);
        
        return output.join('\n');
    }
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TestReporter;
}