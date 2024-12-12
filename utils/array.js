/**
 * Splits an array into chunks of specified size
 * @param {Array} array The array to split
 * @param {number} size The size of each chunk
 * @returns {Array[]} An array of chunks
 */
export function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
