const path = require("path");
const os = require("os");

function getAppDataPath() {
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

function getUploadsPath() {
  return path.join(getAppDataPath(), "uploads");
}

function getDatabasePath() {
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
