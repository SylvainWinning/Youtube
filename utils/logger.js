import { config } from '../config.js';

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor(level = 'INFO') {
    this.level = logLevels[level] || logLevels.INFO;
  }

  error(...args) {
    if (this.level >= logLevels.ERROR) {
      console.error(new Date().toISOString(), '[ERROR]', ...args);
    }
  }

  warn(...args) {
    if (this.level >= logLevels.WARN) {
      console.warn(new Date().toISOString(), '[WARN]', ...args);
    }
  }

  info(...args) {
    if (this.level >= logLevels.INFO) {
      console.info(new Date().toISOString(), '[INFO]', ...args);
    }
  }

  debug(...args) {
    if (this.level >= logLevels.DEBUG) {
      console.debug(new Date().toISOString(), '[DEBUG]', ...args);
    }
  }
}

// Initialisation du logger avec le niveau de log défini dans config.js
export const logger = new Logger(config.app.logLevel);
