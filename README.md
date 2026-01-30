```
██╗   ██╗███╗   ██╗███████╗███████╗ █████╗      ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
██║   ██║████╗  ██║██╔════╝██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██╔██╗ ██║█████╗  █████╗  ███████║    ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██║    ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝██║ ╚████║███████╗██║     ██║  ██║    ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
**Version:** v3.0.0 (Security-Enhanced)  
    Tailscale • Nginx • code-server • Multi-user
**Breaking changes:** Unix user isolation added in v3.0.0
==================================================
```

# UNEFA Codex - Dockerized Code-Server Workspace System

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Shell](https://img.shields.io/badge/shell-bash-green.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)
![Platform](https://img.shields.io/badge/platform-ubuntu%2022.04-purple.svg)
![Docker](https://img.shields.io/badge/docker-20.10+-2496ED.svg?logo=docker&logoColor=white)

**Languages:** [🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md)

A production-ready system for running multiple isolated code-server workspaces using Docker, Nginx, and Tailscale.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HOST SYSTEM                          │
│                                                               │
│  ┌──────────────┐         ┌─────────────────────────────┐   │
│  │   Tailscale  │────────▶│          Nginx              │   │
│  │    Funnel    │         │      (Port 80)              │   │
│  │  (Public)    │         │                             │   │
│  └──────────────┘         │  / → Landing Page           │   │
│                           │  /user1/ → 127.0.0.1:8081   │   │
│                           │  /user2/ → 127.0.0.1:8082   │   │
│                           │  ...                         │   │
│                           │  /user20/ → 127.0.0.1:8100  │   │
│                           └─────────────────────────────┘   │
│                                      │                       │
│                                      ▼                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         DOCKER CONTAINER (codex-workspaces)            │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐       ┌──────────┐        │ │
│  │  │ user1    │  │ user2    │  ...  │ user20   │        │ │
│  │  │ :8081    │  │ :8082    │       │ :8100    │        │ │
│  │  │code-     │  │code-     │       │code-     │        │ │
│  │  │server    │  │server    │       │server    │        │ │
│  │  └──────────┘  └──────────┘       └──────────┘        │ │
│  │                                                         │ │
│  │  All workspaces running in ONE container               │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       ~/codex/users/ (Persistent Storage)              │ │
│  │                                                         │ │
│  │  user1/  user2/  user3/  ...  user20/                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Components:** Nginx (reverse proxy) + Tailscale (public exposure) on host → Docker container with code-server instances → Persistent storage

---

## 🚀 Quick Start

### Prerequisites
- Docker, Nginx, Tailscale (authenticated)
- `curl`, `unzip`
- Ubuntu 22.04 LTS recommended

### Installation

```bash
chmod +x codex-setup.sh
sudo ./codex-setup.sh
```

**You will be asked to choose:**
1. **Full Setup (Tailscale Public Access):** Public URL via Tailscale funnel (`https://app.ts.net`)
2. **Local Network Setup (LAN only):** LAN access only via server IP (`http://192.168.x.x`)
3. **Uninstall (Delete everything):** Remove Codex services, data, and configs

### Usage Modes

**Option 1: Full Setup (Tailscale Public Access)**
- Secure HTTPS endpoint through Tailscale funnel
- Accessible from anywhere with your Tailscale auth
- Prompts for `myapp.ts.net`-style domain

**Option 2: Local Network Setup (LAN only)**
- Standard HTTP served on the LAN only
- Detects server IP automatically (you can override)
- No Tailscale or public internet required; access via `http://<SERVER-IP>/`

**Option 3: Uninstall (Delete everything)**
- Stops systemd services and removes Docker container/image
- Removes Nginx config, workspace data, and supporting files
- Requires typing `YES` to confirm irreversible deletion

### Non-Interactive Setup (CI/CD)

```bash
export CODEX_NUM_USERS=15
export CODEX_DOMAIN="myapp.ts.net"
sudo -E ./codex-setup.sh
```

---

## 💻 Pre-installed Languages

| Language | Version | Tools |
|----------|---------|-------|
| **Python** | 3.10+ | pip, venv, pipenv, poetry, black, flake8 |
| **Node.js** | 22.12.0 LTS (NVM) | Bun (preferred), npm, yarn, pnpm, TypeScript, ESLint, Prettier, nodemon |
| **Node.js (Next)** | 24.x Current | Available via NVM (`nvm use 24`) |
| **Go** | 1.25.5 | go mod, go build, go test |
| **Rust** | Latest (rustup) | cargo, rustc |
| **C++** | GCC toolchain | g++, make, build-essential |
| **C#** | .NET SDK 8.0 | `dotnet` CLI, new console/web templates |

**Also included:** Git, build-essential, gcc/g++, wget, curl, code-server, NVM profile hooks, .NET workload manager

**Supported projects:** React, Vue, Flask, Django, Express, FastAPI, REST APIs, CLI tools, data science, and more

---

## 🔐 Workspace Credentials

- Workspace 1: `user1` / `user1-pass`
- Workspace 2: `user2` / `user2-pass`
- ...and so on

---

## 🛡️ Security & Isolation

**Unix User Isolation:**
- Each workspace runs as dedicated Linux user (`user1`-`user30`)
- No root access inside workspaces
- Users can VIEW other workspaces (read-only) but CANNOT DELETE files outside their own

**Permissions:**
- Own workspace: Full read/write/delete
- Other workspaces: Read-only
- System files: Read-only

**Test it:**
```bash
docker exec -it codex-workspaces su - user1
whoami  # Shows: user1
rm /bin/ls  # Permission denied
```

---

## 🎛️ Management

### View Status
```bash
systemctl status codex-workspaces
docker ps | grep codex
```

### Restart Services
```bash
sudo systemctl restart codex-workspaces
```

### View Logs
```bash
docker logs -f codex-workspaces
journalctl -xeu codex-workspaces
```

### Full Uninstall
```bash
sudo ./codex-setup.sh
# Choose option 3: Uninstall (Delete everything)
# Type 'YES' to confirm
```

**What gets removed:**
- All workspace data
- Docker container & image
- Nginx configs
- Systemd services
- Tailscale funnel

---

## 🔧 Configuration

Edit variables before installation or use environment variables:

```bash
CODEX_NUM_USERS=25        # Number of workspaces (1-30)
CODEX_DOMAIN="app.ts.net" # Your Tailscale domain
```

**To change configuration:** Re-run setup script with new values. Cleanup is automatic.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Container not running | `sudo systemctl restart codex-workspaces` |
| 502 Bad Gateway | Check if container is up: `docker ps` |
| Port conflicts | Verify ports 8081-81XX are available |
| File permission errors | Workspaces run as Unix users (by design) |

**Check logs:**
```bash
docker logs --tail 50 codex-workspaces
journalctl -xeu codex-workspaces --no-pager -n 50
```

---

## 📊 Compatibility

| Component | Requirement |
|-----------|-------------|
| **OS** | Ubuntu 22.04 LTS |
| **Docker** | 20.10+ |
| **Nginx** | 1.18+ |
| **Tailscale** | Any recent version |

**Version:** v3.0.0 (Security-Enhanced)  
**Release:** December 2025

### Upgrading from v1.x

```bash
# Backup data (optional)
sudo cp -r ~/codex/users ~/codex-backup

# Run setup (automatic cleanup)
sudo ./codex-setup.sh
```

**Breaking changes:** Unix user isolation added in v3.0.0

---

## 📂 Repository Layout

```
codex-workspaces/
├── codex-setup.sh          # Main installer/orchestrator script
├── src/                    # React + Tailwind UI for the desktop companion
├── public/                 # Static assets (workspaces.json, manifest, icons)
├── src-tauri/              # Tauri Rust backend and bundle config
├── dist/                   # Vite build output (generated)
├── node_modules/           # Project dependencies (generated)
├── package.json            # Vite/Tauri workspace manifest
├── tailwind.config.js      # Tailwind design tokens
├── vite.config.ts          # Vite + PWA configuration
├── README.md               # EN docs
└── README.es.md            # ES docs
```

### Provisioned Host Layout

Once `codex-setup.sh` runs it provisions the server under `~/codex/`:

```
~/codex/
├── landing/                # Workspace selector served by Nginx
├── users/                  # user1 … userN home directories
└── docker/                 # Auto-generated Dockerfile and startup scripts
```

---

## 🖥️ Desktop Companion App

The bundled desktop assistant streamlines running `codex-setup.sh` and opening workspaces.

### Requirements

- Bun (preferred) or Node.js 18+ with npm available
- Rust toolchain + `cargo install tauri-cli`

### Install Dependencies

```bash
bun install
```

### Development

```bash
# Launch Vite + Tauri together
bun run tauri:dev

# Browser-only preview (optional)
bun run dev
```

The UI defaults to the repository copy of `codex-setup.sh`. Update the path field in the app if you relocate it.

### Build Desktop Packages

```bash
# Compile production assets
bun run build

# Produce Linux bundles (AppImage, deb, rpm) and the raw binary
bun run tauri:build

# Produce only the raw Linux executable (no AppImage/deb/rpm)
bun run tauri build --bundles none
```

Executables live under `src-tauri/target/release/`.

---

## 🌐 Network & Ports

- **Nginx:** Port 80 (host)
- **Code-server:** Ports 8081-81XX (inside container, using `--network host`)
- **Tailscale:** HTTPS via funnel

---

## 📖 Additional Resources

**Main Script:**
- `codex-setup.sh` - Multi-mode: Full (1), Cleanup (2), or Local (3)

**Usage:**
```bash
sudo ./codex-setup.sh
# Option 1: Full Setup (Tailscale)
# Option 2: Local Network Mode (LAN only)
# Option 3: Uninstall (Delete everything)
```

All configuration via interactive prompts or environment variables (`CODEX_NUM_USERS`, `CODEX_DOMAIN`).

---

## 📜 License

MIT License - Copyright (c) 2025 Buffer Ring Organization

See [LICENSE](LICENSE) for details.

## 👥 Credits

**Developed by [BufferRing](https://github.com/BufferRing)**  
Website: [bufferring.org](https://bufferring.org)

**Community Project:** This is an open-source educational tool made freely available to students and teachers. It is not officially endorsed by or affiliated with any institution or government entity.

