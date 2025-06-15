// server.js (用于短轮询和长轮询的服务器)
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json()); // 用于解析 JSON 请求体

let currentData = { value: 0 };
let listeners = []; // 用于长轮询的监听器

// 短轮询端点
app.get('/data', (req, res) => {
    console.log('Short polling request received.');
    res.json(currentData);
});

// 长轮询端点
app.get('/longpoll', (req, res) => {
    console.log('Long polling request received. Holding connection...');
    listeners.push(res); // 将响应对象保存起来
    // 设置一个超时，如果长时间没有数据更新，则断开连接
    req.on('close', () => {
        // 从监听器列表中移除已关闭的连接
        listeners = listeners.filter(listener => listener !== res);
        console.log('Long polling client disconnected or timed out.');
    });
});

// 数据更新接口，用于触发长轮询响应
app.post('/update', (req, res) => {
    const newData = req.body.newValue;
    if (newData !== undefined) {
        currentData.value = newData;
        console.log('Data updated to:', currentData.value);

        // 通知所有长轮询的客户端
        listeners.forEach(listener => {
            listener.json(currentData); // 发送最新数据
            listener.end(); // 关闭连接
        });
        listeners = []; // 清空监听器列表

        res.status(200).send('Data updated and clients notified.');
    } else {
        res.status(400).send('Invalid data.');
    }
});

// 模拟定时数据更新
setInterval(() => {
    const newValue = Math.floor(Math.random() * 100);
    currentData = { value: newValue };
    console.log(`Simulating data update: ${newValue}`);

    // 如果有长轮询监听器，通知它们
    if (listeners.length > 0) {
        listeners.forEach(listener => {
            listener.json(currentData);
            listener.end();
        });
        listeners = []; // 清空监听器列表
        console.log('Notified long polling clients.');
    }
}, 7000); // 每 7 秒模拟一次数据更新

app.listen(PORT, () => {
    console.log(`Polling server listening at http://localhost:${PORT}`);
});