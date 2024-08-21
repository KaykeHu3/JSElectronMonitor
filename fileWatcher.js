const watch = require('node-watch');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const userDataPath = path.join(os.homedir(), 'myapp-data'); // Usar um diretório de dados do usuário
const pathsFile = path.join(userDataPath, 'paths.json');

// Verifica se o diretório existe e cria se não existir
fs.ensureDirSync(userDataPath);

let foldersMap = {};

async function moveFileWithDelay(srcPath, destPath, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await fs.move(srcPath, destPath);
        console.log(`Arquivo movido: ${srcPath}`);
        resolve();
      } catch (err) {
        console.error(`Erro ao mover o arquivo: ${err.message}`);
        reject(err);
      }
    }, delay);
  });
}

async function isFileNew(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const now = new Date();
    const creationTime = new Date(stats.birthtime);
    return (now - creationTime) < 2000; // 2000 ms = 2 segundos
  } catch (err) {
    console.error(`Erro ao verificar o arquivo: ${err.message}`);
    return false;
  }
}

function startWatchingFolders() {
  console.log('Starting to watch folders:', foldersMap);
  Object.keys(foldersMap).forEach(sourceFolder => {
    const destinationFolder = foldersMap[sourceFolder];

    watch(sourceFolder, { recursive: false }, async (event, filePath) => {
      if (event === 'update' && filePath.endsWith('.json2')) {
        if (!await isFileNew(filePath)) {
          const fileName = path.basename(filePath);
          const destPath = path.join(destinationFolder, fileName);
          console.log(`Arquivo modificado em ${sourceFolder}: ${filePath}`);
          await moveFileWithDelay(filePath, destPath, 5000); // 5000 ms = 5 segundos
        } else {
          console.log(`Arquivo ignorado (novo): ${filePath}`);
        }
      }
    });

    console.log(`Monitorando mudanças em: ${sourceFolder}`);
  });
}

async function loadFoldersMap() {
  try {
    if (await fs.pathExists(pathsFile)) {
      const data = await fs.readJson(pathsFile);
      foldersMap = data;
      startWatchingFolders();
    } else {
      startWatchingFolders();
    }
  } catch (err) {
    console.error(`Erro ao carregar caminhos: ${err.message}`);
  }
}

async function saveFoldersMap() {
  try {
    await fs.writeJson(pathsFile, foldersMap);
  } catch (err) {
    console.error(`Erro ao salvar caminhos: ${err.message}`);
  }
}

function addFolderMap(newFolderMap) {
  console.log('Adding new folderMap:', newFolderMap); // Verifique os dados recebidos
  foldersMap = { ...foldersMap, ...newFolderMap };
  saveFoldersMap();
  startWatchingFolders();
}

(async () => {
  await loadFoldersMap();
})();

module.exports = { addFolderMap, loadFoldersMap };
