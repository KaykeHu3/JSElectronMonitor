const watch = require('node-watch');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const userDataPath = path.join(os.homedir(), 'myapp-data'); // Usar um diretório de dados do usuário
const pathsFile = path.join(userDataPath, 'paths.json');

// Verifica se o diretório existe e cria se não existir
fs.ensureDirSync(userDataPath);

let foldersMap = {};

// Cria a estrutura de pastas no destino
function ensureDestDir(filePath, destDir) {
  const relativePath = path.relative(path.dirname(filePath), filePath);
  const destPath = path.join(destDir, relativePath);
  const destDirPath = path.dirname(destPath);
  fs.ensureDirSync(destDirPath);
}

// Move o arquivo com um atraso
async function moveFileWithDelay(srcPath, destPath, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        ensureDestDir(srcPath, path.dirname(destPath));
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

// Verifica se o arquivo é novo
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

// Começa a observar as pastas
function startWatchingFolders() {
  console.log('Starting to watch folders:', foldersMap);
  Object.keys(foldersMap).forEach(sourceFolder => {
    const destinationFolder = foldersMap[sourceFolder];

    watch(sourceFolder, { recursive: true }, async (event, filePath) => {
      if (event === 'update' && filePath.endsWith('.json2')) {
        if (!await isFileNew(filePath)) {
          const relativePath = path.relative(sourceFolder, filePath);
          const destPath = path.join(destinationFolder, relativePath);
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

// Carrega o mapa de pastas
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

// Salva o mapa de pastas
async function saveFoldersMap() {
  try {
    await fs.writeJson(pathsFile, foldersMap);
  } catch (err) {
    console.error(`Erro ao salvar caminhos: ${err.message}`);
  }
}

// Adiciona um novo mapa de pastas
function addFolderMap(newFolderMap) {
  console.log('Adding new folderMap:', newFolderMap); // Verifique os dados recebidos
  foldersMap = { ...foldersMap, ...newFolderMap };
  saveFoldersMap();
  startWatchingFolders();
}

// Executa o carregamento inicial do mapa de pastas
(async () => {
  await loadFoldersMap();
})();

module.exports = { addFolderMap, loadFoldersMap };
