const { app, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");

let mainWindow;

/* ---------------------------
   AUTO UPDATER CONFIG
---------------------------- */

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

autoUpdater.on("checking-for-update", () => {
  console.log("Checking for update...");
});

autoUpdater.on("update-available", () => {
  console.log("Update available.");
});

autoUpdater.on("update-not-available", () => {
  console.log("No updates available.");
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log(
    "Download speed:",
    progressObj.bytesPerSecond,
    "Downloaded:",
    progressObj.percent + "%"
  );
});

autoUpdater.on("update-downloaded", () => {
  console.log("Update downloaded. Installing...");
  autoUpdater.quitAndInstall();
});

/* ---------------------------
   START EXPRESS SERVER
---------------------------- */

function startServer() {
  const serverPath = path.join(__dirname, "server", "app.js");
  console.log("Loading server from:", serverPath);
  require(serverPath);
}

/* ---------------------------
   CREATE WINDOW
---------------------------- */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      devTools: true   // keep true while testing
    }
  });

  mainWindow.setMenu(null);

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "client", "build", "index.html")
    );
  }
}

/* ---------------------------
   APP READY
---------------------------- */

app.whenReady().then(() => {
  startServer();
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});