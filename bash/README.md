# Bash Scripts

This directory contains shell scripts for building and running the application in a Bash-like environment (e.g., Linux, macOS, or Windows Subsystem for Linux).

## Scripts

-   `start.sh`: Installs all necessary `npm` dependencies and then launches the application in development mode using `electron .`.
-   `build.sh`: Installs all necessary `npm` dependencies and then runs the `electron-builder` process to create a distributable package for your current platform. The output will be located in the `dist` directory at the project root.

## Usage

Before running, you may need to make the scripts executable:

```bash
chmod +x start.sh
chmod +x build.sh
```

Then, you can run them from the project root directory:

```bash
./bash/start.sh
./bash/build.sh
```
