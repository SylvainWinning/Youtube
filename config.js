import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier `.env`
dotenv.config();

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    tokens: {
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN,
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      tokenType: 'Bearer',
      expiresIn: parseInt(process.env.YOUTUBE_TOKEN_EXPIRES_IN, 10) || 3599,
    },
  },
  sheets: {
    tokens: {
      accessToken: process.env.SHEETS_ACCESS_TOKEN,
      refreshToken: process.env.SHEETS_REFRESH_TOKEN,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      tokenType: 'Bearer',
      expiresIn: parseInt(process.env.SHEETS_TOKEN_EXPIRES_IN, 10) || 3599,
    },
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'INFO', // Niveau de log par défaut
  },
};
