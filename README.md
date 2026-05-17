# Element-Jitsu (Client)

**Play at:** https://jigglyjelo.github.io/Element-Jitsu-Client/

A multiplayer web game built with React and Vite. Players can create lobbies, join matches, and battle opponents with strategic elemental moves.

This repository contains the frontend client. The backend Socket.IO server repository can be found here: https://github.com/JigglyJelo/Element-Jitsu-Server

## Tech Stack
* **Framework:** React + TypeScript
* **Build Tool:** Vite
* **Real-Time Communication:** Socket.IO-Client
* **Deployment:** GitHub Pages (Automated via GitHub Actions)

## Local Development

To run this project locally alongside the server, just use standard NPM commands:
```bash
npm install
npm run dev
```

> **Local Testing:** By default, the Vite dev environment (`npm run dev`) automatically points the Socket.IO client to `http://localhost:3000` to communicate with your local backend.

## Deployment

This project is automatically deployed to **GitHub Pages** using a GitHub Actions workflow whenever code is pushed to the `main` branch. 

When built for production, the app automatically switches its connection URL to communicate with the live backend hosted on Render. 

## License

This project is licensed under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**. See the LICENSE file for details.