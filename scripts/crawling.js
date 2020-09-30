const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const progress = require('cli-progress');

let GENRES = [];
let GENRES_DICTIONARY = {};

async function crawling(page, genre) {
  try {
    const API_ADDRESS = `https://www.imdb.com/search/title/?title_type=tv_series,tv_miniseries&num_votes=5000,&genres=${genre.name}&sort=user_rating,desc&start=${(page - 1) * 50 + 1}&ref_=adv_nxt`;
    const { data } = await axios.get(API_ADDRESS);
    const elements = getElements(data);
    const dramas = [];

    for (const element of elements) {
      const thumbnail = getThumbnail(element);
      const title = getTitle(element);
      const age = getAge(element);
      const description = getDescription(element);
      const time = getTime(element);
      const period = getPeriod(element);
      const genres = getGenres(element);

      dramas.push({ thumbnail, title, age, description, time, period, genres });
    }

    return dramas;
  } catch (e) {
    return [];
  }
}

function getElements(data) {
  const $ = cheerio.load(data);
  const elements = [];

  $(".lister-list .lister-item.mode-advanced")
    .each((index, element) => {
      elements.push(element);
    });

  return elements;
}

function getGenres(element) {
  const $ = cheerio.load(element);
  let genres = [];

  $(".lister-item-content .text-muted span.genre")
    .each((index, elem) => {
      try {
        genres = (elem.children[0].data || '').trim().split(',').map((genreName) => GENRES_DICTIONARY[genreName.trim()]) || [];
      } catch (e) {
      }
    });

  return genres;
}

function getThumbnail(element) {
  const $ = cheerio.load(element);
  let thumbnail = '';

  $(".lister-item-image.float-left a img")
    .each((index, elem) => {
      try {
        thumbnail = elem.attribs.loadlate || '';
      } catch (e) {
      }
    });

  return thumbnail;
}

function getDescription(element) {
  const $ = cheerio.load(element);
  let description = '';

  $(".lister-item-content p.text-muted")
    .each((index, elem) => {
      if (index === 1) {
        try {
          description = elem.children[0].data.slice(5, -1) || '';
        } catch (e) {
        }
      }
    });

  return description;
}

function getPeriod(element) {
  const $ = cheerio.load(element);
  let period = '';

  $(".lister-item-content h3.lister-item-header span.lister-item-year.text-muted.unbold")
    .each((index, elem) => {
      try {
        period = elem.children[0].data || '';
      } catch (e) {
      }
    });

  return period;
}

function getTime(element) {
  const $ = cheerio.load(element);
  let time = '';

  $(".lister-item-content .text-muted span.runtime")
    .each((index, elem) => {
      try {
        time = elem.children[0].data || '';
      } catch (e) {
      }
    });

  return time;
}

function getAge(element) {
  const $ = cheerio.load(element);
  let age = '';

  $(".lister-item-content .text-muted span.certificate")
    .each((index, elem) => {
      try {
        age = elem.children[0].data || '';
      } catch (e) {
      }
    });

  return age;
}

function getTitle(element) {
  const $ = cheerio.load(element);
  let title = '';

  $(".lister-item-content h3.lister-item-header a")
    .each((index, elem) => {
      try {
        title = elem.children[0].data || '';
      } catch (e) {
      }
    });

  return title;
}

async function clearAllDrama() {
  const { data } = await axios.get('http://localhost:81/api/dramas?_limit=9999');

  const singleProgress = new progress.SingleBar({
    format: `Remove All Dramas {bar} {percentage}% | {value}/{total} dramas`,
    clearOnComplete: false,
    hideCursor: true
  }, progress.Presets.shades_grey);
  singleProgress.start(data.length, 0);

  for (const drama of data) {
    await axios.delete(`http://localhost:81/api/dramas/${drama.id}`);
    singleProgress.increment();
  }

  singleProgress.stop();
}

async function getDramas() {
  const { data } = await axios.get('http://localhost:81/api/dramas?_limit=9999');
  return data;
}

async function download(url) {
  const filename = url.split('https://m.media-amazon.com/images/M/')[1];
  const fileWriter = fs.createWriteStream(`./thumbnails/${filename}`);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });

  response.data.pipe(fileWriter);

  return new Promise((resolve, reject) => {
    fileWriter.on('finish', resolve);
    fileWriter.on('error', reject);
  });
}

async function getTotalDramaCount(genre) {
  try {
    const API_ADDRESS = `https://www.imdb.com/search/title/?title_type=tv_series,tv_miniseries&num_votes=5000,&genres=${genre}&sort=user_rating,desc&start=${1}&ref_=adv_nxt`;
    const { data } = await axios.get(API_ADDRESS);
    const $ = cheerio.load(data);
    let totalCount = 1;

    $("#main .article .nav .desc span")
      .each((index, element) => {
        if (index === 0) {
          const base = (element.children[0].data || '').split('of')[1] || element.children[0].data;
          const count = (base.split('titles')[0] || '').trim().replace(',', '');
          try {
            totalCount = Number(count);
          } catch (e) {
            totalCount = 0;
          }
        }
      });

    return totalCount || 0;
  } catch (e) {
    return 0;
  }
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

async function crawlingDrama() {
  await clearAllDrama();
  const { data } = await axios.get('http://localhost:81/api/genres');
  GENRES = data;
  GENRES_DICTIONARY = GENRES.reduce((prev, current) => { prev[current.match.trim()] = current.id; return prev; }, {});

  for (const GENRE of GENRES) {
    const singleProgress = new progress.SingleBar({
      format: `Crawling Drama {bar} {percentage}% | {value}/{total} ${GENRE.match} dramas`,
      clearOnComplete: false,
      hideCursor: true
    }, progress.Presets.shades_grey);
    let dramas = [];
    let page = 1;
    let totalCount = await getTotalDramaCount(GENRE.name);

    singleProgress.start(totalCount, 0);

    do {
      try {
        dramas = await crawling(page, GENRE);

        for (const drama of dramas) {
          const { data } = await axios.get((`http://localhost:81/api/dramas?title=${encodeURIComponent(drama.title)}`));

          singleProgress.increment();
          if (data && data.length) continue;

          await axios.post('http://localhost:81/api/dramas', drama);
        }
      } catch (e) {
        page++;
        break;
      }

      await new Promise((resolve) => { setTimeout(() => resolve(), 500); });
      page++;

    } while (dramas.length);

    singleProgress.stop();
  }
}

async function main() {
  const begin = Date.now();
  console.log('All Crawling is Begin -', new Date());

  await crawlingDrama();
  await downloadThumbnails();

  const end = Date.now();
  console.log('All Crawling is Done -', new Date());
  console.log('time : ', (end - begin) / 1000, 'seconds');
}

main();