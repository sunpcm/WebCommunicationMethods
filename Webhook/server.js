// webhook-receiver-server.js (requires: npm install express body-parser crypto)
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // 用于验证签名

const app = express();
const PORT = 3000;

// Webhook 的秘密密钥，用于验证请求来源
// 在实际应用中，这应该是一个环境变量或从安全配置中加载
const WEBHOOK_SECRET = 'your_super_secret_webhook_key';

// 使用 raw body parser 来获取原始请求体，以便计算签名
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        // 将原始请求体存储在 req.rawBody 中
        req.rawBody = buf.toString();
    }
}));

// 定义 Webhook 接收端点
app.post('/webhook', (req, res) => {
    console.log('Received Webhook request!');

    // --- 安全验证示例 (以 GitHub Webhook 为例) ---
    // GitHub 在请求头中发送一个 X-Hub-Signature-256 签名
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn('Webhook: No signature header provided. Skipping verification.');
        return res.status(401).send('Unauthorized: Signature missing.');
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    if (digest !== signature) {
        console.error('Webhook: Invalid signature. Request rejected.');
        return res.status(403).send('Forbidden: Invalid signature.');
    }
    // --- 安全验证结束 ---

    // 获取事件类型 (以 GitHub 为例)
    const eventType = req.headers['x-github-event'];
    const payload = req.body; // Webhook 的数据负载

    console.log(`Webhook Event Type: ${eventType}`);
    console.log('Webhook Payload:', JSON.stringify(payload, null, 2));

    // 根据事件类型处理不同的逻辑
    switch (eventType) {
        case 'push':
            console.log(`Code pushed to branch: ${payload.ref}`);
            // 触发 CI/CD 流程、发送通知等
            break;
        case 'issues':
            console.log(`Issue '${payload.issue.title}' was ${payload.action}.`);
            // 更新看板、通知团队等
            break;
        // 可以添加更多事件类型处理
        default:
            console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).send('Webhook received and processed successfully!');
});

// 简单的根路径，可以用于健康检查
app.get('/', (req, res) => {
    res.send('Webhook Receiver is running.');
});

app.listen(PORT, () => {
    console.log(`Webhook receiver server listening at http://localhost:${PORT}`);
    console.log(`Please configure your WebHook source (e.g., GitHub) to send POST requests to http://your-public-ip:${PORT}/webhook`);
});