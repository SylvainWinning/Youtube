import { sheets } from '../sheets/sheets.js';
import { logger } from '../../utils/logger.js';

async function testWriteToSheets() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID; // ID de la feuille Google Sheets
  const sheetName = 'TestSheet'; // Nom de l'onglet de test

  try {
    logger.info(`Starting test: Writing to Spreadsheet ${spreadsheetId}`);

    // Données simples pour le test
    const testValues = [
      ['Titre', 'Chaîne', 'Durée'],
      ['Test Video 1', 'Test Channel 1', '5m30s'],
      ['Test Video 2', 'Test Channel 2', '10m15s'],
    ];

    // Debug : Affichage des données préparées pour Google Sheets
    logger.debug('Data being sent to Google Sheets:', testValues);
    console.log('Prepared sheet values:', testValues); // Pour affichage brut dans la console

    // Écriture des données dans la feuille
    const range = `'${sheetName}'!A1:C3`; // Écriture des données dans les cellules A1 à C3
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: testValues,
      },
    });

    // Log détaillé de la réponse API Google Sheets
    logger.debug('Google Sheets API response:', response.data);
    console.log('Google Sheets API response:', JSON.stringify(response.data, null, 2));

    logger.info(`Test data written successfully. Updated ${response.data.updatedCells} cells.`);
  } catch (error) {
    logger.error('Error during test write:', error.message);
    if (error.response?.data) {
      logger.error('Error response from API:', error.response.data);
    }
  }
}

// Exécuter le test d'écriture dans Google Sheets
testWriteToSheets();
