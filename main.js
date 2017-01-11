
'use strict'


 const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const autoUpdater = require("electron").autoUpdater


 var path = require('path');

const squirrelEvent = process.argv[1];
class AppUpdater {
  constructor(window) {

    const version = app.getVersion();
    autoUpdater.addListener("update-available", (event) => {
      console.log("A new update is available")
    })
    autoUpdater.addListener("update-downloaded", (event, releaseNotes, releaseName, releaseDate, updateURL) => {
      notify("A new update is ready to install", 'Version ${releaseName} is downloaded and will be automatically installed on Quit');

      autoUpdater.quitAndInstall();
    })
    autoUpdater.addListener("error", (error) => {
      console.log(error)
    })
    autoUpdater.addListener("checking-for-update", (event) => {
      console.log("checking-for-update")
    })
    autoUpdater.addListener("update-not-available", () => {
      console.log("update-not-available")
    })
    autoUpdater.setFeedURL('http://localhost:8000/dist/releases/')

    window.webContents.once("did-frame-finish-load", (event) => {

       if(squirrelEvent!='--squirrel-firstrun'){
          console.log("adsfas");
          autoUpdater.checkForUpdates();
        }
    })
  }
}
//
function notify(title, message) {
  let windows = BrowserWindow.getAllWindows()
  if (windows.length == 0) {
    return
  }

  windows[0].webContents.send("notify", title, message)
}


if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };


  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

var mainWindow = null;
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,

      shadow:true,

      visible: true
  });
    mainWindow.webContents.openDevTools()
  new AppUpdater(mainWindow);

  var file = 'file://' + __dirname + '/index.html';
  mainWindow.loadURL(file);

  mainWindow.on('closed', function() {

    mainWindow = null;
  });
});