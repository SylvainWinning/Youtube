import { getPlaylistVideos } from '../youtube/playlist.js';
import { sheets } from '../sheets/sheets.js';
import { logger } from '../utils/logger.js';

function escapeForFormula(text) {
  if (!text) return '';
  return text.replace(/"/g, '""');
}

export async function syncPlaylistToSheets(playlistId, spreadsheetId, options) {
  const { sheetName = 'YouTube Videos', startCell = 'A1', maxResults = 50 } = options;

  logger.info(`Syncing playlist ${playlistId} to sheet ${spreadsheetId}`);

  // 1. Récupération des vidéos
  const videos = await getPlaylistVideos(playlistId, maxResults);
  const videosProcessed = videos.length;

  // 2. Préparation des données avec liens cliquables
  const sheetValues = videos.map(video => {
    const safeTitle = escapeForFormula(video.title);
    const safeChannel = escapeForFormula(video.channel);

    return [
      `=HYPERLINK("https://youtube.com/watch?v=${video.videoId}", "${safeTitle}")`,
      `=HYPERLINK("https://www.youtube.com/channel/${video.channelId}", "${safeChannel}")`,
      video.duration
    ];
  });

  // En-têtes (RAW)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetName}'!A1:C1`,
    valueInputOption: 'RAW',
    resource: {
      values: [
        ['Titre', 'Chaîne', 'Durée']
      ]
    }
  });

  // Données (USER_ENTERED pour interpréter les formules)
  const dataRange = `'${sheetName}'!A2:C`;
  const updateResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: dataRange,
    valueInputOption: 'USER_ENTERED',
    resource: { values: sheetValues }
  });

  const updatedCells = updateResponse.data.updatedCells || 0;
  const updatedRows = sheetValues.length;
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
