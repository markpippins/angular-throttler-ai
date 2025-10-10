// fs-client.js

import { submitRequest } from './broker-client.js';

const SERVICE_NAME = 'restFsService';

/**
 * Lists files in a directory.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the directory.
 * @returns {Promise<any>} A promise that resolves with the list of files.
 */
function listFiles(alias, path) {
    return submitRequest(SERVICE_NAME, 'listFiles', { alias, path });
}

/**
 * Changes the current directory.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the directory.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function changeDirectory(alias, path) {
    return submitRequest(SERVICE_NAME, 'changeDirectory', { alias, path });
}

/**
 * Creates a directory.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the new directory.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function createDirectory(alias, path) {
    return submitRequest(SERVICE_NAME, 'createDirectory', { alias, path });
}

/**
 * Removes a directory.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the directory to remove.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function removeDirectory(alias, path) {
    return submitRequest(SERVICE_NAME, 'removeDirectory', { alias, path });
}

/**
 * Creates a file.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the directory where the file will be created.
 * @param {string} filename The name of the file to create.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function createFile(alias, path, filename) {
    return submitRequest(SERVICE_NAME, 'createFile', { alias, path, filename });
}

/**
 * Deletes a file.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the directory where the file is located.
 * @param {string} filename The name of the file to delete.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function deleteFile(alias, path, filename) {
    return submitRequest(SERVICE_NAME, 'deleteFile', { alias, path, filename });
}

/**
 * Renames a file or directory.
 * @param {string} alias The alias of the file system.
 * @param {string[]} path The path to the file or directory to rename.
 * @param {string} newName The new name.
 * @returns {Promise<any>} A promise that resolves with the result of the operation.
 */
function rename(alias, path, newName) {
    return submitRequest(SERVICE_NAME, 'rename', { alias, path, newName });
}

export {
    listFiles,
    changeDirectory,
    createDirectory,
    removeDirectory,
    createFile,
    deleteFile,
    rename
};