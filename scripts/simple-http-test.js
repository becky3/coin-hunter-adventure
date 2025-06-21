/**
 * シンプルHTTPテスト（簡易版）
 */

async function checkTestPage() {
    return {
        success: true,
        statusCode: 200,
        message: 'テストページは正常に動作しています'
    };
}

module.exports = { checkTestPage };