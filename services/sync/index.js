import { getPlaylistVideos } from '../youtube/playlist.js';  // Adapte le chemin si nécessaire
import { sheets } from '../sheets/sheets.js';               // Idem, adapte le chemin
import { logger } from '../../utils/logger.js';             // Assure-toi que le chemin est correct

export async function syncPlaylistToSheets(playlistId, spreadsheetId, options) {
  const { sheetName = 'YouTube Videos', startCell = 'A1', maxResults = 50 } = options;

  logger.info(`Syncing playlist ${playlistId} to sheet ${spreadsheetId}`);

  // 1. Récupération des vidéos de la playlist
  const videos = await getPlaylistVideos(playlistId, maxResults);
  const videosProcessed = videos.length;

  // 2. Préparation des données pour la Google Sheet (Titre, Chaîne, Durée)
  const sheetValues = videos.map(video => [
    video.title,
    video.channel,
    video.duration
  ]);

  // Écrire les en-têtes en première ligne
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!A1:C1`,  // Ligne 1 pour les titres
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['Titre', 'Chaîne', 'Durée']
      ]
    }
  });

  // 3. Mise à jour de la Google Sheet avec les données, à partir de la deuxième ligne
  const dataRange = `'${sheetName}'!A2:C`; // On commence à A2 pour laisser la première ligne aux en-têtes
  const resource = { values: sheetValues };

  const updateResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: dataRange,
    valueInputOption: 'RAW',
    resource
  });

  const updatedCells = updateResponse.data.updatedCells || 0;
  const updatedRows = sheetValues.length; // Nombre de lignes de vidéos insérées
  const updatedColumns = updatedRows > 0 ? sheetValues[0].length : 0;

  logger.info(`Processed ${videosProcessed} videos`);
  logger.info(`Updated ${updatedRows} rows and ${updatedColumns} columns`);
  logger.info(`Total cells updated: ${updatedCells}`);

  // **NOUVELLE ÉTAPE** : Appliquer des bordures dynamiques
  // On a 1 ligne d'en-tête + updatedRows lignes de données = updatedRows + 1 lignes au total.
  const totalRows = updatedRows + 1;

  // Applique des bordures autour de A1:C(totalRows)
  // Indices : lignes et colonnes commencent à 0
  // A = col 0, B = col 1, C = col 2 → endColumnIndex = 3 car exclusif
  // Ligne 1 = index 0, totalRows = nombre total de lignes (exclusif)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          updateBorders: {
            range: {
              sheetId: 0, // L'ID de la feuille, à adapter si nécessaire
              startRowIndex: 0,
              endRowIndex: totalRows,
              startColumnIndex: 0,
              endColumnIndex: 3
            },
            top: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            },
            bottom: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            },
            left: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            },
            right: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            },
            innerHorizontal: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            },
            innerVertical: {
              style: "SOLID",
              width: 1,
              color: { red: 0, green: 0, blue: 0 }
            }
          }
        }
      ]
    }
  });

  return {
    videosProcessed,
    updatedRows,
    updatedColumns,
    updatedCells
  };
}
