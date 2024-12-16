import { getPlaylistVideos } from '../youtube/playlist.js';
import { sheets } from '../sheets/sheets.js';
import { logger } from '../../utils/logger.js';

function escapeForFormula(text) {
  if (!text) return '';
  return text.replace(/"/g, '""');
}

export async function syncPlaylistToSheets(playlistId, spreadsheetId, options = {}) {
  const { sheetName = 'YouTube Videos', startCell = 'A1', maxResults = 50 } = options;

  try {
    logger.info(`Starting sync: Playlist ${playlistId} to Spreadsheet ${spreadsheetId}`);

    // 1. Fetch playlist videos
    const videos = await getPlaylistVideos(playlistId, maxResults);
    const videosProcessed = videos.length;

    if (videosProcessed === 0) {
      logger.warn('No videos found in the playlist.');
      return { videosProcessed: 0, updatedRows: 0, updatedColumns: 0, updatedCells: 0 };
    }

    // 2. Prepare sheet data
    const sheetValues = videos.map((video) => {
      const safeTitle = escapeForFormula(video.title);
      const safeChannel = escapeForFormula(video.channel);

      return [
        `=HYPERLINK("https://youtube.com/watch?v=${video.videoId}", "${safeTitle}")`,
        `=HYPERLINK("https://www.youtube.com/channel/${video.channelId}", "${safeChannel}")`,
        video.duration,
      ];
    });

    // 3. Write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1:C1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Title', 'Channel', 'Duration']],
      },
    });

    // 4. Write video data
    const dataRange = `'${sheetName}'!A2:C`;
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: dataRange,
      valueInputOption: 'USER_ENTERED',
      resource: { values: sheetValues },
    });

    const updatedCells = updateResponse.data.updatedCells || 0;
    const updatedRows = sheetValues.length;
    const updatedColumns = updatedRows > 0 ? sheetValues[0].length : 0;

    logger.info(`Processed ${videosProcessed} videos`);
    logger.info(`Updated ${updatedRows} rows and ${updatedColumns} columns`);
    logger.info(`Total cells updated: ${updatedCells}`);

    // 5. Apply borders
    const totalRows = updatedRows + 1; // Include header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            updateBorders: {
              range: {
                sheetId: 0, // Ensure this corresponds to the correct sheet
                startRowIndex: 0,
                endRowIndex: totalRows,
                startColumnIndex: 0,
                endColumnIndex: 3,
              },
              top: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
              bottom: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
              left: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
              right: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
              innerHorizontal: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
              innerVertical: { style: 'SOLID', width: 1, color: { red: 0, green: 0, blue: 0 } },
            },
          },
        ],
      },
    });

    logger.info('Borders applied successfully.');

    return {
      videosProcessed,
      updatedRows,
      updatedColumns,
      updatedCells,
    };
  } catch (error) {
    logger.error('Error during sync process:', error);
    throw error;
  }
}
