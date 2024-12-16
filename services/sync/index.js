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
    logger.debug('Fetched videos:', videos);

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

    logger.debug('Prepared sheet values:', sheetValues);

    // 3. Write headers
    logger.debug('Writing headers to the sheet...');
    const headerResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A1:C1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Title', 'Channel', 'Duration']],
      },
    });
    logger.debug('Header update response:', headerResponse.data);

    // 4. Write video data
    const dataRange = `'${sheetName}'!A2:C`;
    logger.debug(`Writing video data to range: ${dataRange}`);
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: dataRange,
      valueInputOption: 'USER_ENTERED',
      resource: { values: sheetValues },
    });
    logger.debug('Data update response:', updateResponse.data);

    const updatedCells = updateResponse.data.updatedCells || 0;
    const updatedRows = sheetValues.length;
    const updatedColumns = updatedRows > 0 ? sheetValues[0].length : 0;

    logger.info(`Processed ${videosProcessed} videos`);
    logger.info(`Updated ${updatedRows} rows and ${updatedColumns} columns`);
    logger.info(`Total cells updated: ${updatedCells}`);

    // 5. Apply borders
    const totalRows = updatedRows + 1; // Include header row
    logger.debug('Applying borders to the sheet...');
    const borderResponse = await sheets.spreadsheets.batchUpdate({
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
    logger.debug('Border update response:', borderResponse.data);

    logger.info('Borders applied successfully.');

    // 6. Verify if updates were successful
    if (updatedCells === 0) {
      logger.warn('No cells were updated. Verify data and permissions.');
    } else {
      logger.info('Sheet updated successfully!');
    }

    return {
      videosProcessed,
      updatedRows,
      updatedColumns,
      updatedCells,
    };
  } catch (error) {
    if (error.response?.data) {
      logger.error('Error response from API:', error.response.data);
    }
    logger.error('Error during sync process:', error.message || error);
    throw error;
  }
}
