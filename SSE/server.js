// server.js (requires: npm install express)
const express = require('express');
const cors = require('cors'); // 用于处理跨域请求
const app = express();
const PORT = 8080;

app.use(cors()); // 允许所有跨域请求，实际应用中应配置具体白名单

app.get('/events', (req, res) => {
    // 设置响应头，告知客户端这是事件流
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive'); // 保持连接

    // 允许客户端进行跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');

    let counter = 0;
    const intervalId = setInterval(() => {
        counter++;
        // 发送默认 'message' 事件
        res.write(`data: Server time: ${new Date().toLocaleTimeString()}\n\n`);

        // 发送自定义事件
        if (counter % 3 === 0) {
            res.write(`event: customEvent\n`);
            res.write(`data: This is a custom event at count ${counter}\n\n`);
        }

        if (counter >= 10) {
            // 发送一个重试间隔，告诉客户端在连接断开后多少毫秒后重试连接
            res.write('retry: 5000\n');
            res.write('data: Closing connection after 10 messages.\n\n');
            clearInterval(intervalId);
            res.end(); // 结束连接
            console.log('SSE connection closed by server.');
        }
    }, 2000); // 每2秒发送一次数据

    // 当客户端断开连接时，清理计时器
    req.on('close', () => {
        clearInterval(intervalId);
        console.log('Client disconnected from SSE.');
    });
});

app.listen(PORT, () => {
    console.log(`SSE server listening at http://localhost:${PORT}`);
});