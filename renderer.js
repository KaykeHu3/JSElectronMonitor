const { ipcRenderer } = require('electron');

document.getElementById('selectSourceFolder').addEventListener('click', async () => {
  const [sourceFolder] = await ipcRenderer.invoke('open-folder-dialog');
  document.getElementById('sourceFolder').value = sourceFolder;
});

document.getElementById('selectDestFolder').addEventListener('click', async () => {
  const [destinationFolder] = await ipcRenderer.invoke('open-folder-dialog');
  document.getElementById('destinationFolder').value = destinationFolder;
});

document.getElementById('addFolders').addEventListener('click', () => {
  const sourceFolder = document.getElementById('sourceFolder').value;
  const destinationFolder = document.getElementById('destinationFolder').value;

  if (sourceFolder && destinationFolder) {
    ipcRenderer.send('add-folder', { sourceFolder, destinationFolder });
  } else {
    alert('Por favor, selecione ambos os caminhos.');
  }
});
