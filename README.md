<div align="center">

<p>
  <img src=".github/logo.svg" alt="Git Identity Manager" width="520">
</p>

# Git Identity Manager

Desktop app for managing Git identities and GitHub CLI accounts with a simple, visual and one-click experience.

<p>
  <a href="https://github.com/phricardo/Git-Identity-Manager/releases">
    <img alt="Latest Release" src="https://img.shields.io/github/v/release/phricardo/Git-Identity-Manager?style=for-the-badge&label=Latest%20Release">
  </a>
  <a href="https://github.com/phricardo/Git-Identity-Manager/stargazers">
    <img alt="GitHub Stars" src="https://img.shields.io/github/stars/phricardo/Git-Identity-Manager?style=for-the-badge">
  </a>
  <a href="https://github.com/phricardo/Git-Identity-Manager/issues">
    <img alt="GitHub Issues" src="https://img.shields.io/github/issues/phricardo/Git-Identity-Manager?style=for-the-badge">
  </a>
  <a href="https://github.com/phricardo/Git-Identity-Manager/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/github/license/phricardo/Git-Identity-Manager?style=for-the-badge">
  </a>
</p>

<p>
  <a href="https://git-identity-manager.phricardo.com/downloads">
    <strong>Download LTS</strong>
  </a>
  ·
  <a href="https://github.com/phricardo/Git-Identity-Manager">
    GitHub Repository
  </a>
  ·
  <a href="https://github.com/phricardo/Git-Identity-Manager/issues">
    Report a Bug
  </a>
</p>

</div>

---

## About the Project

**Git Identity Manager** is a desktop application created to make it easier to manage multiple Git identities and GitHub CLI accounts on the same machine.

If you work with a personal GitHub account, company account, open source projects, freelance projects or different Git identities, you probably already had to switch between `git config`, `gh auth login`, `gh auth status` and `gh auth switch`.

Git Identity Manager brings this workflow into a visual desktop interface, helping you view, organize and switch identities without repeating manual terminal commands every time.

The project is built with **Tauri 2**, using **Rust** for the desktop/system layer and **React + Vite** for the frontend.

---

## Download

The recommended version for most users is the **LTS release**.

You can download the app here:

**https://git-identity-manager.phricardo.com/downloads**

The LTS version is the recommended build for users who want a more stable experience.

---

## Features

- Manage local Git identities in one place
- View configured Git profiles
- Work with multiple GitHub CLI accounts
- Reduce the risk of committing with the wrong identity
- Switch context without manually repeating Git configuration commands
- Desktop experience built with Tauri
- Lightweight frontend built with React and Vite
- Designed for developers who use multiple Git/GitHub accounts

---

## Why Git Identity Manager?

GitHub CLI already helps with authentication, but Git itself still depends on local configuration such as:

```bash
git config user.name
git config user.email
````

That means switching accounts in GitHub CLI does not always guarantee that your commits are being signed with the correct Git identity.

Git Identity Manager was created to solve this daily developer pain with a simple interface focused on clarity, control and speed.

---

## Supported Platforms

Current stable support:

* Windows

Planned / in progress:

* Linux
* macOS

> macOS support may require additional signing or security steps depending on the build and distribution method.

---

## Tech Stack

* [Tauri 2](https://tauri.app/)
* [Rust](https://www.rust-lang.org/)
* [React](https://react.dev/)
* [Vite](https://vitejs.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [GitHub CLI](https://cli.github.com/)

---

## Requirements

Before running the project locally, make sure you have:

* Node.js and npm
* Rust 1.78 or newer
* Tauri prerequisites for your operating system
* Git installed
* GitHub CLI installed, if you want to use GitHub account features

For Windows development, check the official Tauri prerequisites:

https://tauri.app/start/prerequisites/

---

## Development

Install dependencies:

```bash
npm install
```

Run the frontend in development mode:

```bash
npm run dev
```

Run the Tauri desktop app:

```bash
npm run tauri dev
```

---

## Build

Build the frontend:

```bash
npm run build
```

Check the Rust/Tauri backend:

```bash
cd src-tauri
cargo check
```

Build the app installers:

```bash
npm run tauri build
```

---

## Project Structure

```txt
.
├── src/                 # React frontend
├── src-tauri/           # Tauri/Rust backend
├── .github/             # GitHub assets and workflows
├── package.json
├── README.md
└── LICENSE.md
```

---

## Files Not Intended For GitHub

The `.gitignore` already excludes dependencies, build output, installers, logs, environment files and local configuration.

Do not version:

* `node_modules/`
* `dist/`
* `src-tauri/target/`
* `src-tauri/.cargo/config.toml`
* `.env` files
* generated installers and binaries
* local OS configuration files

---

## Publishing Checklist

Before publishing a new release, run:

```bash
npm run build
```

Then check the Rust/Tauri backend:

```bash
cd src-tauri
cargo check
```

Finally, build the installers:

```bash
npm run tauri build
```

Recommended release flow:

1. Update the app version
2. Run frontend build
3. Run Rust backend checks
4. Build installers
5. Create a GitHub release
6. Publish the LTS build on the downloads page

---

## Contributing

Contributions are welcome.

You can help by:

* Opening issues
* Reporting bugs
* Suggesting improvements
* Testing releases
* Improving documentation
* Sending pull requests

To report a bug or suggest a feature, open an issue:

https://github.com/phricardo/Git-Identity-Manager/issues

---

## Repository

GitHub repository:

https://github.com/phricardo/Git-Identity-Manager

---

## Author

Created by **Pedro Ricardo**.

* Website: https://phricardo.com/
* GitHub: https://github.com/phricardo

---

## License

This software is licensed for personal and non-commercial use only.

See [LICENSE.md](LICENSE.md) for details.
