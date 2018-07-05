const electron = require('electron');
const url = require('url');
const path = require('path');

const {app, BrowserWindow} = electron;

let mainWindow;

app.on('ready', function () {
  mainWindow = new BrowserWindow({width: 900, height: 800, icon: path.join(__dirname, 'resources/favicon.ico')});
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file',
    slashes: true
  }));
});

app.on('window-all-closed', () => {
  app.quit();
});