const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
let mainWindow
const autoUpdater = require("electron").autoUpdater

const squirrelCommand = process.argv[1]

autoUpdater.on('update-availabe', () => {
    console.log('update available')
})
autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update')
})
autoUpdater.on('update-not-available', () => {
    console.log('update-not-available')
})

autoUpdater.on('update-downloaded', (e) => {
  console.log(e)
  alert("A new update is ready to install, and will be automatically installed on Quit?")
    autoUpdater.quitAndInstall()
})

  autoUpdater.setFeedURL('http://localhost:8000/dist/releases/')

const createWindow = () => {
  mainWindow = new BrowserWindow({ width: 800, height: 600, visible: true})

 // mainWindow.loadURL('file://${__dirname}/index.html')
    mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.once("did-frame-finish-load", function (event) {
    if(squirrelCommand!='--squirrel-firstrun'){
      autoUpdater.checkForUpdates();
    }

  })
  //window.autoUpdater = autoUpdater
}

app.on('ready', createWindow)
app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

console.log(squirrelCommand);
  switch (squirrelCommand) {
    case '--squirrel-install':
    //  autoUpdater.createShortcut(function () { app.quit() })
     // break
    case '--squirrel-updated':
    case '--squirrel-obsolete':
      app.quit()
      return true
  }
