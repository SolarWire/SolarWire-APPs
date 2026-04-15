const net = require('net');
const port = 3000;
const timeout = 30000; // 30 seconds
const startTime = Date.now();

console.log(`Waiting for Vite server to start on port ${port}...`);

function checkPort() {
  const socket = new net.Socket();
  
  socket.setTimeout(1000);
  
  socket.on('connect', () => {
    console.log('Vite server ready, starting Electron...');
    socket.destroy();
    process.exit(0);
  });
  
  socket.on('error', () => {
    if (Date.now() - startTime > timeout) {
      console.error('Timeout waiting for Vite server');
      process.exit(1);
    }
    setTimeout(checkPort, 1000);
  });
  
  socket.on('timeout', () => {
    socket.destroy();
    if (Date.now() - startTime > timeout) {
      console.error('Timeout waiting for Vite server');
      process.exit(1);
    }
    setTimeout(checkPort, 1000);
  });
  
  socket.connect(port, 'localhost');
}

checkPort();