import { getPlaylistVideos } from '../youtube/playlist.js';  // Adapte le chemin si différent
import { sheets } from '../sheets/sheets.js';               // Idem, adapte le chemin
import { logger } from '../../utils/logger.js';             // Assure-toi que le chemin est correct

export async function syncPlaylistToSheets(playlistId, spreadsheetId, options) {
  const { sheetName = 'YouTube Videos', startCell = 'A1', maxResults = 50 } = options;

  logger.info(`Syncing playlist ${playlistId} to sheet ${spreadsheetId}`);

  // 1. Récupération des vidéos de la playlist
  const videos = await getPlaylistVideos(playlistId, maxResults);
  const videosProcessed = videos.length;

  // 2. Préparation des données pour la Google Sheet
  // Chaque ligne contiendra : Titre, Chaîne, Durée
  const sheetValues = videos.map(video => [
    video.title,
    video.channel,
    video.duration
  ]);

  // 3. Mise à jour de la Google Sheet
  const range = `'${sheetName}'!${startCell}`;
  const resource = { values: sheetValues };

  const updateResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource
  });

  const updatedCells = updateResponse.data.updatedCells || 0;
  const updatedRows = sheetValues.length;
  const updatedColumns = updatedRows > 0 ? sheetValues[0].length : 0;

  logger.info(`Processed ${videosProcessed} videos`);
  logger.info(`Updated ${updatedRows} rows and ${updatedColumns} columns`);
  logger.info(`Total cells updated: ${updatedCells}`);

  return {
    videosProcessed,
    updatedRows,
    updatedColumns,
    updatedCells
  };
}
