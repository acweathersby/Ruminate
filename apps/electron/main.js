const { app, BrowserWindow } = require('electron')


function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 600,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  //win.webContents.openDevTools()

  // and load the index.html of the app.
  win.loadFile('index.html')
}

app.on('ready', createWindow)
