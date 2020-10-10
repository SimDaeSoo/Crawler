const axios = require('axios');
const fs = require('fs');
const progress = require('cli-progress');

async function getDramas() {
  const { data } = await axios.get('http://localhost:81/api/dramas?_limit=9999');
  return data;
}

async function downloadThumbnails() {
  const dramas = await getDramas();
  const multiProgress = new progress.MultiBar({
    format: 'Download Thumbnails {bar} {percentage}% | {value}/{total} files',
    clearOnComplete: false,
    hideCursor: true
  }, progress.Presets.shades_grey);
  const thumbnailProgress = multiProgress.create(dramas.length, 0);

  for (const drama of dramas) {
    const url = drama.thumbnail;
    const base = url.split('._')[0];
    const extension = url.split('._')[1].split('.')[1];

    try {
      await download(`${base}.${extension}`);
    } catch (e) {
      console.log('error : ', drama.id);
    }

    thumbnailProgress.increment();
  }
  multiProgress.stop();
}

async function download(url) {
  const filename = url.split('https://m.media-amazon.com/images/M/')[1];
  const fileWriter = fs.createWriteStream(`../nextjs/public/assets/${filename}`);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });

  response.data.pipe(fileWriter);

  return new Promise((resolve, reject) => {
    fileWriter.on('finish', resolve);
    fileWriter.on('error', reject);
  });
}

downloadThumbnails();