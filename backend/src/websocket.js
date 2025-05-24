const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // 示例：发送消息给客户端
  ws.send(JSON.stringify({ type: 'notification', content: 'Welcome to the WebSocket server!' }));
});

module.exports = wss; 