import { google } from 'googleapis';
import { sheetsAuth } from './oauth2Client.js';
import { logger } from '../../utils/logger.js';

const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

export async function writeToSheet(spreadsheetId, sheetName, data) {
  try {
    // Écriture des en-têtes
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1:C1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Titre', 'Chaîne', 'Durée']],
      },
    });

    // Écriture des données
    const range = `'${sheetName}'!A2:C${data.length + 1}`;
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: data,
      },
    });

    logger.info(`Updated ${response.data.updatedCells} cells in Google Sheets.`);
  } catch (error) {
    logger.error('Error writing to Google Sheets:', error);
    throw error;
  }
}
