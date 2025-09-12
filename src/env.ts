// const node_env = {};
// Object.keys(process.env).forEach(key => {
//     node_env[key] = process.env[key]
//     console.log('Node env var key: ' + key);
// });

// console.log("argv: " + process.argv);

// console.log("NODE_ENV: " + process.env.NODE_ENV);

// console.log("Node's env", JSON.stringify(process.env));
const dataVar = process.env['DATA_DIR'];
const imagesVar = process.env['IMAGES_DIR']
console.log(`Data env-var: ${dataVar} - ${process.env.data_dir}`);
console.log(`Images env-var: ${imagesVar} - ${process.env.images_dir}`);

const data = process.argv.find(arg => arg.startsWith('--dataDir='))?.replace('--dataDir=', '')
const images = process.argv.find(arg => arg.startsWith('--imgDir='))?.replace('--imgDir=', '')
const chromePath = process.argv.find(arg => arg.startsWith('--chromePath='))?.replace('--chromePath=', '')
process.env.PUPPETEER_EXECUTABLE_PATH = chromePath;

export const DATA_DIR = data || './data';
export const IMAGES_DIR = images || './images';
// Log configured directories
console.log(`Data directory: ${DATA_DIR}`);
console.log(`Images directory: ${IMAGES_DIR}`);
