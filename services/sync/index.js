import { getPlaylistVideos } from '../youtube/playlist.js';
import { sheets } from '../sheets/sheets.js';
import { logger } from '../../utils/logger.js';

export async function syncPlaylistToSheets(playlistId, spreadsheetId, options) {
  const { sheetName = 'YouTube Videos', startCell = 'A1', maxResults = 50 } = options;

  logger.info(`Syncing playlist ${playlistId} to sheet ${spreadsheetId}`);

  // 1. Récupération des vidéos de la playlist
  const videos = await getPlaylistVideos(playlistId, maxResults);
  const videosProcessed = videos.length;

  // 2. Préparation des données pour la Google Sheet (Titre, Chaîne, Durée)
  // On utilise HYPERLINK pour créer des liens cliquables
  // =HYPERLINK("URL", "TEXTE_D_AFFICHAGE")
  const sheetValues = videos.map(video => [
    `=HYPERLINK("https://youtube.com/watch?v=${video.videoId}", "${video.title}")`,
    `=HYPERLINK("https://www.youtube.com/channel/${video.channelId}", "${video.channel}")`,
    video.duration
  ]);

  // Écrire les en-têtes en première ligne (les en-têtes peuvent rester en RAW)
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
  // Ici, on passe en USER_ENTERED pour que les formules HYPERLINK soient interprétées
  const dataRange = `'${sheetName}'!A2:C`; // On commence à A2 pour laisser la première ligne aux en-têtes
  const resource = { values: sheetValues };

  const updateResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: dataRange,
    valueInputOption: 'USER_ENTERED',  // IMPORTANT : permet d'interpréter les formules
    resource
  });

  const updatedCells = updateResponse.data.updatedCells || 0;
  const updatedRows = sheetValues.length; // Nombre de lignes de vidéos insérées
  const updatedColumns = updatedRows > 0 ? sheetValues[0].length : 0;

  logger.info(`Processed ${videosProcessed} videos`);
  logger.info(`Updated ${updatedRows} rows and ${updatedColumns} columns`);
  logger.info(`Total cells updated: ${updatedCells}`);

  // Application des bordures dynamiques
  const totalRows = updatedRows + 1; // 1 ligne d'en-tête + updatedRows lignes de données

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
