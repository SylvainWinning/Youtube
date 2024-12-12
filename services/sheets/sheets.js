import { google } from 'googleapis';
import { sheetsAuth } from '../auth/oauth2Client.js';

export const sheets = google.sheets({
  version: 'v4',
  auth: sheetsAuth
});
