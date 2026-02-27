const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");
const fs = require("fs");

let mainWindow;

/* ---------------------------
   LOGGING
---------------------------- */

log.transports.file.level = "info";
autoUpdater.logger = log;

/* ---------------------------
   DATABASE BACKUP BEFORE UPDATE
---------------------------- */

function backupDatabase() {
  try {
    const userDataPath = app.getPath("userData");
    const dbFile = path.join(userDataPath, "payroll.db");

    if (fs.existsSync(dbFile)) {
      const backupName = `payroll_backup_${Date.now()}.db`;
      const backupPath = path.join(userDataPath, backupName);
      fs.copyFileSync(dbFile, backupPath);
      log.info("Database backup created:", backupPath);
    }
  } catch (err) {
    log.error("Database backup failed:", err);
  }
}

/* ---------------------------
   AUTO UPDATER EVENTS
---------------------------- */

autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info.version);
});

autoUpdater.on("update-not-available", () => {
  log.info("No updates available.");
});

autoUpdater.on("error", (err) => {
  log.error("Update error:", err);
});

autoUpdater.on("download-progress", (progress) => {
  const percent = Math.round(progress.percent);

  if (mainWindow) {
    mainWindow.webContents.send("update-progress", percent);
  }
});

autoUpdater.on("update-downloaded", () => {
  log.info("Update downloaded.");

  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update Ready",
    message: "A new version has been downloaded.",
    detail: "Restart the application to apply the update.",
    buttons: ["Restart Now", "Later"],
    defaultId: 0
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

/* ---------------------------
   START EXPRESS SERVER
---------------------------- */

function startServer() {
  const serverPath = path.join(__dirname, "server", "app.js");
  log.info("Loading server from:", serverPath);
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
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.setMenu(null);

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

  // Expose correct userData path to backend
  process.env.USER_DATA_PATH = app.getPath("userData");

  startServer();
  createWindow();

  if (app.isPackaged) {
    backupDatabase();
    autoUpdater.checkForUpdates();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});