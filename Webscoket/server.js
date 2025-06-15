// server.js (requires: npm install ws)
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    console.log('A new client connected!');

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);

        // 将消息广播给所有连接的客户端
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(`[Broadcast] ${message}`);
            } else if (client === ws) {
                client.send(`You said: ${message}`); // 发送回给自己
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.send('Welcome to the WebSocket server!');
});

console.log('WebSocket server started on ws://localhost:8080');