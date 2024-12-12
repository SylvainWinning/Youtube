import { youtube } from '../youtube.js';
import { formatDuration } from '../../utils/duration.js';
import { logger } from '../../utils/logger.js';
import { handleApiError } from '../../utils/error-handler.js';
import { chunkArray } from '../../utils/array.js';

const MAX_VIDEOS_PER_REQUEST = 50;

export async function getPlaylistVideos(playlistId) {
  try {
    logger.debug(`Fetching playlist items for playlist: ${playlistId}`);
    const videos = await fetchPlaylistItems(playlistId);
    return await enrichVideosWithDuration(videos);
  } catch (error) {
    throw handleApiError('YouTube', 'fetching playlist videos', error);
  }
}

async function fetchPlaylistItems(playlistId) {
  let allItems = [];
  let nextPageToken = null;

  do {
    const response = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: MAX_VIDEOS_PER_REQUEST,
      pageToken: nextPageToken || ''
    });

    const items = response.data.items || [];
    allItems = allItems.concat(items);
    nextPageToken = response.data.nextPageToken;

  } while (nextPageToken);

  if (!allItems.length) {
    logger.warn(`No videos found in playlist: ${playlistId}`);
    return [];
  }

  return allItems.map(mapPlaylistItemToVideo);
}

function mapPlaylistItemToVideo(item) {
  // channel ici est celui du playlistItem, pas la chaîne d'origine de la vidéo.
  return {
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    videoId: item.contentDetails.videoId,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description
  };
}

async function enrichVideosWithDuration(videos) {
  if (!videos.length) return videos;
  
  const videoIds = videos.map(video => video.videoId);
  const durations = await getVideoDurations(videoIds);

  // On réintègre channelTitle et channelId obtenus via fetchVideoDurationsChunk
  return videos.map(video => {
    const matched = durations.find(d => d.videoId === video.videoId);
    return {
      ...video,
      channel: matched ? matched.channelTitle : video.channel,
      channelId: matched ? matched.channelId : null, // On ajoute ici channelId
      duration: matched ? matched.duration : 'N/A'
    };
  });
}

async function getVideoDurations(videoIds) {
  try {
    const chunks = chunkArray(videoIds, MAX_VIDEOS_PER_REQUEST);
    const durationsPromises = chunks.map(fetchVideoDurationsChunk);
    const durationsArrays = await Promise.all(durationsPromises);
    return durationsArrays.flat();
  } catch (error) {
    throw handleApiError('YouTube', 'fetching video durations', error);
  }
}

async function fetchVideoDurationsChunk(videoIds) {
  const response = await youtube.videos.list({
    part: 'snippet,contentDetails',
    id: videoIds.join(',')
  });

  return response.data.items.map(item => ({
    videoId: item.id,
    duration: formatDuration(item.contentDetails.duration),
    channelTitle: item.snippet.channelTitle, // Chaîne d'origine
    channelId: item.snippet.channelId // On ajoute channelId ici
  }));
}
