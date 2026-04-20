const https = require('https');

const cache = {};

function fetchAlbumArt(artist, album) {
  const key = `${artist}||${album}`;
  if (cache[key]) return Promise.resolve(cache[key]);

  const term = encodeURIComponent(album ? `${artist} ${album}` : artist);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1&media=music`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.results && parsed.results.length > 0) {
            const artUrl = parsed.results[0].artworkUrl100.replace('100x100bb', '512x512bb');
            cache[key] = artUrl;
            resolve(artUrl);
          } else {
            cache[key] = null;
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = { fetchAlbumArt };
