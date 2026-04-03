const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const path = require("path");
const fs = require("fs");

let mainWindow;
const STORAGE_CONFIG_FILE = "storage-config.json";

app.setName("AMIEM Payroll");

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
    const dbFile = process.env.DB_PATH || path.join(app.getPath("userData"), "payroll.db");
    const backupDir = path.dirname(dbFile);

    if (fs.existsSync(dbFile)) {
      const backupName = `payroll_backup_${Date.now()}.db`;
      const backupPath = path.join(backupDir, backupName);
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

async function startServer() {
  const serverPath = path.join(__dirname, "server", "app.js");
  const serverPort = Number(process.env.SERVER_PORT || 3001);
  log.info("Loading server from:", serverPath);

  const { startServer: bootServer } = require(serverPath);

  try {
    await bootServer(serverPort);
  } catch (err) {
    if (err.code === "EADDRINUSE") {
      log.warn(`Port ${serverPort} already in use. Reusing existing server.`);
      return;
    }

    throw err;
  }
}

function getStorageConfigPath() {
  return path.join(app.getPath("userData"), STORAGE_CONFIG_FILE);
}

function getDefaultDatabasePath() {
  return path.join(app.getPath("userData"), "payroll.db");
}

function readStorageConfig() {
  try {
    const configPath = getStorageConfigPath();

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (!parsed.dbPath || typeof parsed.dbPath !== "string") {
      return null;
    }

    return parsed;
  } catch (err) {
    log.warn("Could not read storage config:", err);
    return null;
  }
}

function writeStorageConfig(dbPath) {
  const configPath = getStorageConfigPath();

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      dbPath,
      updatedAt: new Date().toISOString()
    }, null, 2)
  );
}

function validateDatabasePath(dbPath) {
  const directory = path.dirname(dbPath);

  fs.mkdirSync(directory, { recursive: true });
  fs.accessSync(directory, fs.constants.R_OK | fs.constants.W_OK);

  return true;
}

async function chooseNewDatabasePath({ copyFromPath } = {}) {
  while (true) {
    const selected = await dialog.showOpenDialog({
      title: copyFromPath
        ? "Choose a folder for the shared payroll database"
        : "Choose a folder for the new payroll database",
      properties: ["openDirectory", "createDirectory"]
    });

    if (selected.canceled || !selected.filePaths[0]) {
      return null;
    }

    const dbPath = path.join(selected.filePaths[0], "payroll.db");

    try {
      validateDatabasePath(dbPath);

      if (copyFromPath && fs.existsSync(copyFromPath)) {
        if (fs.existsSync(dbPath) && path.resolve(dbPath) !== path.resolve(copyFromPath)) {
          const overwrite = await dialog.showMessageBox({
            type: "warning",
            buttons: ["Replace Existing File", "Choose Another Folder"],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
            title: "Database Already Exists",
            message: "A payroll.db file already exists in that folder.",
            detail: "Choose Replace Existing File to copy your current payroll data into that folder."
          });

          if (overwrite.response !== 0) {
            continue;
          }
        }

        if (path.resolve(dbPath) !== path.resolve(copyFromPath)) {
          fs.copyFileSync(copyFromPath, dbPath);
        }
      }

      return dbPath;
    } catch (err) {
      log.error("Invalid new database path selection:", err);

      await dialog.showMessageBox({
        type: "error",
        title: "Database Location Error",
        message: "AMIEM Payroll could not use that folder.",
        detail: "Please choose a folder that this computer can read and write."
      });
    }
  }
}

async function chooseExistingDatabasePath() {
  while (true) {
    const selected = await dialog.showOpenDialog({
      title: "Choose an existing payroll database",
      properties: ["openFile"],
      filters: [
        { name: "Database files", extensions: ["db", "sqlite", "sqlite3"] },
        { name: "All files", extensions: ["*"] }
      ]
    });

    if (selected.canceled || !selected.filePaths[0]) {
      return null;
    }

    const dbPath = selected.filePaths[0];

    try {
      validateDatabasePath(dbPath);
      return dbPath;
    } catch (err) {
      log.error("Invalid existing database path selection:", err);

      await dialog.showMessageBox({
        type: "error",
        title: "Database Location Error",
        message: "AMIEM Payroll could not use that database file.",
        detail: "Please choose a database file that this computer can read and write."
      });
    }
  }
}

async function chooseDatabasePath() {
  const defaultDbPath = getDefaultDatabasePath();

  while (true) {
    const { response } = await dialog.showMessageBox({
      type: "question",
      buttons: [
        "Create New Shared Database",
        "Use Existing Database",
        "Use Default Local Database",
        "Exit"
      ],
      defaultId: 0,
      cancelId: 3,
      noLink: true,
      title: "Choose Database Location",
      message: "Where should AMIEM Payroll store its database?",
      detail: "To let multiple users work on the same data, choose a shared company folder or network drive. Cloud sync folders like OneDrive or Google Drive can work, but avoid using the same file from two computers at the same time. You can create a new payroll.db there or connect to an existing one."
    });

    try {
      if (response === 0) {
        const dbPath = await chooseNewDatabasePath();
        if (dbPath) {
          return dbPath;
        }
        continue;
      }

      if (response === 1) {
        const dbPath = await chooseExistingDatabasePath();
        if (dbPath) {
          return dbPath;
        }
        continue;
      }

      if (response === 2) {
        validateDatabasePath(defaultDbPath);
        return defaultDbPath;
      }

      return null;
    } catch (err) {
      log.error("Invalid database path selection:", err);

      await dialog.showMessageBox({
        type: "error",
        title: "Database Location Error",
        message: "AMIEM Payroll could not use that database location.",
        detail: "Please choose a folder or database file that this computer can read and write."
      });
    }
  }
}

async function migrateExistingDatabase(defaultDbPath) {
  while (true) {
    const { response } = await dialog.showMessageBox({
      type: "question",
      buttons: [
        "Keep Current Local Database",
        "Move Current Database To Shared Folder",
        "Use Existing Shared Database",
        "Exit"
      ],
      defaultId: 1,
      cancelId: 3,
      noLink: true,
      title: "Choose Database Location",
      message: "AMIEM Payroll found your existing local database.",
      detail: "You can keep using it on this PC, move it to a shared company folder for multiple users, or connect to an existing shared database. For best results, use a shared folder that is always available to all payroll users."
    });

    if (response === 0) {
      validateDatabasePath(defaultDbPath);
      return defaultDbPath;
    }

    if (response === 1) {
      const dbPath = await chooseNewDatabasePath({ copyFromPath: defaultDbPath });
      if (dbPath) {
        return dbPath;
      }
      continue;
    }

    if (response === 2) {
      const dbPath = await chooseExistingDatabasePath();
      if (dbPath) {
        return dbPath;
      }
      continue;
    }

    return null;
  }
}

async function resolveDatabasePath() {
  const configured = readStorageConfig();

  if (configured?.dbPath) {
    try {
      validateDatabasePath(configured.dbPath);
      return configured.dbPath;
    } catch (err) {
      log.warn("Saved database path is no longer usable:", err);
    }
  }

  const defaultDbPath = getDefaultDatabasePath();

  if (fs.existsSync(defaultDbPath)) {
    if (!app.isPackaged) {
      writeStorageConfig(defaultDbPath);
      return defaultDbPath;
    }

    const selectedPath = await migrateExistingDatabase(defaultDbPath);

    if (!selectedPath) {
      return null;
    }

    writeStorageConfig(selectedPath);
    return selectedPath;
  }

  if (!app.isPackaged) {
    writeStorageConfig(defaultDbPath);
    return defaultDbPath;
  }

  const selectedPath = await chooseDatabasePath();

  if (!selectedPath) {
    return null;
  }

  writeStorageConfig(selectedPath);
  return selectedPath;
}

/* ---------------------------
   CREATE WINDOW
---------------------------- */

function createWindow() {
  const windowIconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "assets", "icon.png");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: windowIconPath,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.setMenu(null);

  if (!app.isPackaged) {
    mainWindow.loadURL(process.env.CLIENT_DEV_URL || "http://localhost:3000");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "client", "build", "index.html")
    );
  }
}

/* ---------------------------
   APP READY
---------------------------- */

app.whenReady().then(async () => {
  const dbPath = await resolveDatabasePath();

  if (!dbPath) {
    app.quit();
    return;
  }

  process.env.USER_DATA_PATH = app.getPath("userData");
  process.env.DATA_ROOT_PATH = path.dirname(dbPath);
  process.env.DB_PATH = dbPath;

  log.info("Using configured database path:", dbPath);

  await startServer();
  createWindow();

  if (app.isPackaged) {
    backupDatabase();
    autoUpdater.checkForUpdates();
  }
}).catch(err => {
  log.error("App startup failed:", err);
});

process.on("unhandledRejection", err => {
  log.error("Unhandled promise rejection:", err);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
