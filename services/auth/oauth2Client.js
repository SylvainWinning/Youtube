import { google } from 'googleapis';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

class OAuth2ClientManager {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.clients = new Map();
  }

  createClient(service, tokens) {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );

    oauth2Client.on('tokens', (tokens) => {
      logger.info(`Tokens refreshed for ${service}`);
      // Sauvegardez les nouveaux tokens si nécessaire
      logger.debug('New tokens received:', tokens);
    });

    oauth2Client.setCredentials(tokens);
    this.clients.set(service, oauth2Client);
    return oauth2Client;
  }

  getClient(service) {
    if (!this.clients.has(service)) {
      throw new Error(`No OAuth2 client found for ${service}`);
    }
    return this.clients.get(service);
  }
}

// Initialisation du gestionnaire OAuth2
const oauth2Manager = new OAuth2ClientManager(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri
);

// Création des clients pour YouTube et Google Sheets
const youtubeAuth = oauth2Manager.createClient('youtube', {
  refresh_token: config.google.refreshToken,
});
const sheetsAuth = oauth2Manager.createClient('sheets', {
  refresh_token: config.google.refreshToken,
});

export { youtubeAuth, sheetsAuth, oauth2Manager };
