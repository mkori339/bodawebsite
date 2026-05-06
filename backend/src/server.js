import dotenv from 'dotenv';
import app from './app.js';
import { pool } from './config/db.js';
import { logInfo, logWarn } from './utils/logger.js';

dotenv.config();

const port = Number(process.env.PORT || 3001);

async function startServer() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    logInfo('mysql_connection_established');
  } catch (error) {
    logWarn('mysql_connection_startup_check_failed', {
      error_message: error.message
    });
  }

  app.listen(port, () => {
    logInfo('api_server_listening', { port });
  });
}

startServer();
