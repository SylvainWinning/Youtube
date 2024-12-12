import { google } from 'googleapis';
import { youtubeAuth } from '../auth/oauth2Client.js';

export const youtube = google.youtube({
  version: 'v3',
  auth: youtubeAuth
});
