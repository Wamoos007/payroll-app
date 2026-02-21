const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

/* ==========================
   CREATE WINDOW
========================== */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (app.isPackaged) {
    const indexPath = path.join(__dirname, "client", "build", "index.html");
    console.log("Loading production file:", indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  mainWindow.webContents.openDevTools(); // keep this for debugging for now
}

/* ==========================
   START SERVER SAFELY
========================== */

function startServer() {
  try {
    const serverPath = path.join(__dirname, "server", "app.js");
    console.log("Starting server from:", serverPath);
    require(serverPath);
    console.log("Server started successfully");
  } catch (err) {
    console.error("Server failed to start:", err);
  }
}

/* ==========================
   APP READY
========================== */

app.whenReady().then(() => {

  console.log("Electron ready");

  process.env.DB_PATH = path.join(app.getPath("userData"), "payroll.db");
  console.log("DB PATH:", process.env.DB_PATH);

  startServer();

  createWindow();
});

/* ==========================
   SINGLE INSTANCE LOCK
========================== */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}