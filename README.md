# Git Identity Manager

<p align="left">
  <img src=".github/logo.svg" alt="Git Identity Manager" width="522">
</p>

Desktop app for managing Git identities and GitHub CLI accounts on Windows.

## Overview

Git Identity Manager helps you view and organize local Git identities, profiles, and accounts authenticated through the GitHub CLI. The project uses Tauri 2 for the desktop backend and React/Vite for the frontend.

## Requirements

- Windows
- Node.js and npm
- Rust 1.78 or newer
- Tauri prerequisites for Windows
- GitHub CLI, if you want to use GitHub account features

## Development

Install dependencies:

```powershell
npm install
```

Run the frontend in development mode:

```powershell
npm.cmd run dev
```

Run the Tauri app:

```powershell
npm.cmd run tauri dev
```

## Build

Build the frontend:

```powershell
npm.cmd run build
```

Check the Rust/Tauri backend:

```powershell
cd src-tauri
cargo check
```

Build the app installers:

```powershell
npm.cmd run tauri build
```

## Files Not Intended For GitHub

The `.gitignore` already excludes dependencies, build output, installers, logs, `.env` files, and local configuration. In particular, do not version:

- `node_modules/`
- `dist/`
- `src-tauri/target/`
- `src-tauri/.cargo/config.toml`
- `.env` files
- generated installers and binaries

## Publishing Status

The project is ready to publish to GitHub as long as the current `.gitignore` is respected. Before the first commit, run:

```powershell
npm.cmd run build
cd src-tauri
cargo check
```
