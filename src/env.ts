console.log("Node's env", process.env);
const data = process.env.DATA_DIR;
const images = process.env.IMAGES_DIR
console.log(`Data env-var: ${data}`);
console.log(`Images env-var: ${images}`);


export const DATA_DIR = data || './data';
export const IMAGES_DIR = images || './images';
// Log configured directories
console.log(`Data directory: ${DATA_DIR}`);
console.log(`Images directory: ${IMAGES_DIR}`);
