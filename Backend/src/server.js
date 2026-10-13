const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initializeSocket = require('./sockets');
const { port } = require('./config/env');

const startServer = async () => {
  console.log("Connecting to MongoDB...");
  const res = await connectDB();
  
  const httpServer = http.createServer(app);
  const io = initializeSocket(httpServer);

  app.set('io', io);

  httpServer.listen(port, () => {
    console.log(`Townify API running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${port}/api/v1/health`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
