import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier `.env`
dotenv.config();

export const config = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    tokens: {
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN, // Facultatif si besoin
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN, // Facultatif si besoin
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      tokenType: 'Bearer', // Gardez ceci par défaut
      expiresIn: process.env.YOUTUBE_TOKEN_EXPIRES_IN || 3599, // Facultatif
    },
  },
  sheets: {
    tokens: {
      accessToken: process.env.SHEETS_ACCESS_TOKEN, // Facultatif si besoin
      refreshToken: process.env.SHEETS_REFRESH_TOKEN, // Facultatif si besoin
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      tokenType: 'Bearer', // Gardez ceci par défaut
      expiresIn: process.env.SHEETS_TOKEN_EXPIRES_IN || 3599, // Facultatif
    },
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'INFO', // Niveau de log par défaut
  },
};
