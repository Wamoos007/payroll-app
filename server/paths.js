const path = require("path");
const os = require("os");

function getDefaultStorageRootPath() {
  if (process.env.USER_DATA_PATH) {
    return process.env.USER_DATA_PATH;
  }

  if (process.platform === "darwin") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "payroll-app"
    );
  }

  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "payroll-app"
    );
  }

  return path.join(os.homedir(), ".config", "payroll-app");
}

function getAppDataPath() {
  if (process.env.DATA_ROOT_PATH) {
    return process.env.DATA_ROOT_PATH;
  }

  if (process.env.DB_PATH) {
    return path.dirname(process.env.DB_PATH);
  }

  return getDefaultStorageRootPath();
}

function getUploadsPath() {
  return path.join(getAppDataPath(), "uploads");
}

function getDatabasePath() {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  return path.join(getAppDataPath(), "payroll.db");
}

function getBackupsPath() {
  return path.join(getAppDataPath(), "backups");
}

module.exports = {
  getAppDataPath,
  getUploadsPath,
  getDatabasePath,
  getBackupsPath
};
