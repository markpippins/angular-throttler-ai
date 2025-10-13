const { contextBridge, ipcRenderer } = require('electron');

// Expose a controlled set of APIs to the renderer process (the web page).
contextBridge.exposeInMainWorld('desktopApi', {
  /**
   * Send an async request to the main process and get a response.
   * @param {string} channel The IPC channel to send the request on.
   * @param {...any} args The arguments to send with the request.
   * @returns {Promise<any>} A promise that resolves with the response from the main process.
   */
  invoke: (channel, ...args) => {
    // Whitelist of allowed channels to prevent exposing all of ipcRenderer.
    const allowedChannels = [
        'fs:get-contents',
        'fs:get-folder-tree',
        'fs:create-directory',
        'fs:remove-directory',
        'fs:create-file',
        'fs:delete-file',
        'fs:rename',
        'fs:upload-file',
        'fs:move',
        'fs:copy',
        'fs:search',
    ];
    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    // You could throw an error here for disallowed channels.
    // For now, we'll just return a rejected promise.
    return Promise.reject(new Error(`Channel "${channel}" is not allowed.`));
  },
});
