import { config } from './config.js';
import dotenv from 'dotenv';
import { syncPlaylistToSheets } from './services/sync/index.js';
import { logger } from './utils/logger.js';

dotenv.config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function retryWithDelay(fn, retries = MAX_RETRIES, delay = RETRY_DELAY) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && !error.isAuthError) {
      logger.warn(`Retry attempt remaining: ${retries}. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithDelay(fn, retries - 1, delay);
    }
    throw error;
  }
}

async function init() {
  const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

  // Validate required environment variables
  if (!PLAYLIST_ID || !SPREADSHEET_ID) {
    logger.error('Missing required environment variables:');
    if (!PLAYLIST_ID) logger.error('- YOUTUBE_PLAYLIST_ID');
    if (!SPREADSHEET_ID) logger.error('- GOOGLE_SPREADSHEET_ID');
    process.exit(1);
  }

  try {
    const syncOptions = {
      sheetName: process.env.SHEET_NAME || 'YouTube Videos',
      startCell: process.env.START_CELL || 'A1',
      maxResults: parseInt(process.env.MAX_RESULTS || '50', 10)
    };

    const result = await retryWithDelay(() => 
      syncPlaylistToSheets(PLAYLIST_ID, SPREADSHEET_ID, syncOptions)
    );

    logger.info('Sync completed successfully!');
    logger.info(`Processed ${result.videosProcessed} videos`);
    logger.info(`Updated ${result.updatedRows} rows and ${result.updatedColumns} columns`);
    logger.info(`Total cells updated: ${result.updatedCells}`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Sync failed:', error.message);
    
    // Different exit codes for different types of errors
    if (error.isAuthError) {
      process.exit(2); // Authentication errors
    } else {
      process.exit(1); // Other errors
    }
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

init();
