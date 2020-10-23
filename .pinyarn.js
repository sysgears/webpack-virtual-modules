const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const zlib = require('zlib');
const { PassThrough } = require('stream');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.pinyarn.json'), 'utf8'));

const getUrlHash = url => crypto.createHash('sha256').update(url).digest('hex').substring(0, 8);

const YARN_URL_HASH = getUrlHash(config.yarnUrl);
let BERRY_HEADERS = {
  'User-Agent': `pinyarn/?`
};
if (config.yarnUrl.includes('/artifacts/')) {
  BERRY_HEADERS['Authorization'] = `token ${config.ghTokens[Math.floor(Math.random() * config.ghTokens.length)].join('')}`;
}
const YARNRC_YML_PATH = path.join(__dirname, '.yarnrc.yml');
const PLUGIN_LIST = !fs.existsSync(YARNRC_YML_PATH) ? [] : fs.readFileSync(YARNRC_YML_PATH, 'utf-8')
  .split('\n')
  .filter(line => line.includes('.yarn/plugins/@yarnpkg/plugin-'))
  .map(line => line.replace(/^.*\.yarn\/plugins\/@yarnpkg\/plugin-(.*?)(?:-[0-9a-f]{8})?\.cjs$/, '$1'));
const YARN_DIR = path.join(__dirname, '.yarn');
const RELEASES_DIR = path.join(YARN_DIR, 'releases');
const PLUGIN_DIR = path.join(YARN_DIR, 'plugins');
const YARN_BINARY = path.join(RELEASES_DIR, `yarn-${YARN_URL_HASH}.cjs`);

let stats;
try {
  stats = fs.statSync(RELEASES_DIR);
} catch (e) {}
const CURRENT_YARN_BINARYNAME = !stats ? null : fs.readdirSync(RELEASES_DIR)[0];
const CURRENT_YARN_URL_HASH = !CURRENT_YARN_BINARYNAME ? null : path.basename(CURRENT_YARN_BINARYNAME).slice(0, -path.extname(CURRENT_YARN_BINARYNAME).length).replace('yarn-', '');

const downloadFile = (filePath, url) => {
  const urlParts = new URL(url);
  return new Promise((resolve, reject) =>
    https.get({
      host: urlParts.host,
      path: urlParts.pathname + urlParts.search,
      headers: BERRY_HEADERS
    }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(filePath, res.headers.location).then(resolve, reject);
      } else if (res.statusCode !== 200) {
        throw new Error(`Error downloading ${url}, status: ${res.statusCode}`);
      } else {
        const isZip = res.headers["content-type"] === 'application/zip';
        let skipBytes = isZip ? 37 : 0;
        const file = fs.createWriteStream(filePath);
        const transform = isZip ? zlib.createInflateRaw() : new PassThrough();
        res
          .on('data', chunk => {
            result = chunk.slice(Math.min(chunk.length, skipBytes));
            skipBytes -= Math.min(skipBytes, chunk.length);
            transform.write(result);
          })
          .on('error', err => {
            reject(err);
          })
          .on('end', () => transform.end())
        transform.pipe(file)
          .on('error', reject)
          .on('finish', resolve);
      }
    }).on('error', reject)
  ).catch(err => {
    fs.unlinkSync(filePath);
    throw err;
  });
}

const promises = []

if (CURRENT_YARN_URL_HASH !== YARN_URL_HASH) {
  if (CURRENT_YARN_BINARYNAME) {
    if (fs.existsSync(RELEASES_DIR))
      fs.rmdirSync(RELEASES_DIR, { recursive: true });
    if (fs.existsSync(PLUGIN_DIR))
      fs.rmdirSync(PLUGIN_DIR, { recursive: true });
  }

  if (!fs.existsSync(RELEASES_DIR))
    fs.mkdirSync(RELEASES_DIR, { recursive: true });

  promises.push(downloadFile(YARN_BINARY, config.yarnUrl));
}

for (const plugin of PLUGIN_LIST) {
  const pluginUrl = config.pluginUrls[plugin];
  const pluginPath = path.join(PLUGIN_DIR, '@yarnpkg', `plugin-${plugin}-${getUrlHash(pluginUrl)}.cjs`)
  if (!fs.existsSync(pluginPath)) {
    fs.mkdirSync(path.join(PLUGIN_DIR, '@yarnpkg'), { recursive: true });
    promises.push(downloadFile(pluginPath, pluginUrl));
  }
}

if (PLUGIN_LIST.length === 0) {
  if (fs.existsSync(PLUGIN_DIR))
    fs.rmdirSync(PLUGIN_DIR, { recursive: true });
} else {
  const entries = fs.readdirSync(path.join(PLUGIN_DIR, '@yarnpkg'));
  for (const entry of entries) {
    const [,plugin, pluginHash] = entry.match(/plugin-(.*?)(?:-)?([0-9a-f]{8})?\.cjs/);
    const pluginUrl = config.pluginUrls[plugin];
    if (!PLUGIN_LIST.includes(plugin) || getUrlHash(pluginUrl) !== pluginHash)
      fs.unlinkSync(path.join(PLUGIN_DIR, '@yarnpkg', entry));
  }
}

Promise.all(promises)
  .then(
    () => require(YARN_BINARY),
    console.error
  );
