const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateProgress: (callback) =>
    ipcRenderer.on("update-progress", (_, percent) => callback(percent))
});