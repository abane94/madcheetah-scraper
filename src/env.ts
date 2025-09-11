// const node_env = {};
// Object.keys(process.env).forEach(key => {
//     node_env[key] = process.env[key]
//     console.log('Node env var key: ' + key);
// });

console.log("argv: " + process.argv);

console.log("NODE_ENV: " + process.env.NODE_ENV);

console.log("Node's env", JSON.stringify(process.env));
const data = process.env.DATA_DIR;
const images = process.env.IMAGES_DIR
console.log(`Data env-var: ${data} - ${process.env.data_dir}`);
console.log(`Images env-var: ${images} - ${process.env.images_dir}`);


export const DATA_DIR = data || './data';
export const IMAGES_DIR = images || './images';
// Log configured directories
console.log(`Data directory: ${DATA_DIR}`);
console.log(`Images directory: ${IMAGES_DIR}`);
