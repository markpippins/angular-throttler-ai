# Windows Batch Scripts

This directory contains `.bat` batch scripts for building and running the application on Windows using the Command Prompt (`cmd.exe`).

## Scripts

-   `start.bat`: Installs all necessary `npm` dependencies and then launches the application in development mode using `electron .`.
-   `build.bat`: Installs all necessary `npm` dependencies and then runs the `electron-builder` process to create a distributable package for Windows (e.g., a `.exe` installer). The output will be located in the `dist` directory at the project root.

## Usage

You can run these scripts by double-clicking them in the Windows File Explorer or by running them from the Command Prompt from the project root directory:

```cmd
.\\pwsh\\start.bat
.\\pwsh\\build.bat
```
