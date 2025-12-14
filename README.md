```
██╗   ██╗███╗   ██╗███████╗███████╗ █████╗      ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
██║   ██║████╗  ██║██╔════╝██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██╔██╗ ██║█████╗  █████╗  ███████║    ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██║    ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝██║ ╚████║███████╗██║     ██║  ██║    ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
    Dockerized Workspace Setup (Security-Enhanced)
    Tailscale • Nginx • code-server • Multi-user
==================================================
```

# UNEFA Codex - Dockerized Code-Server Workspace System

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
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
1. **Full Setup (Tailscale):** Public access via secure URL (`https://app.ts.net`)
2. **Cleanup Only:** Remove everything
3. **Local Network Setup:** LAN access only via IP (`http://192.168.x.x`)

### Usage Modes

**Option 1: Internet (Tailscale)**
- Secure HTTPS
- Accessible from anywhere
- Requires Tailscale

**Option 2: Cleanup (Maintenance)**
- Removes Docker containers/images
- Deletes configuration files
- Clears user data (requires confirmation)

**Option 3: Local Network (LAN)**
- Standard HTTP
- Accessible only on same WiFi/Ethernet
- No internet/Tailscale needed
- Access via: `http://<SERVER-IP>/`

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
| **Node.js** | 22.12.0 LTS (NVM) | npm, yarn, pnpm, TypeScript, ESLint, Prettier, nodemon |
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

### Complete Cleanup
```bash
sudo ./codex-setup.sh
# Choose option 2: Cleanup Only
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

**Version:** v2.0 (Security-Enhanced)  
**Release:** December 2025

### Upgrading from v1.x

```bash
# Backup data (optional)
sudo cp -r ~/codex/users ~/codex-backup

# Run setup (automatic cleanup)
sudo ./codex-setup.sh
```

**Breaking changes:** Unix user isolation added in v2.0

---

## 📂 Project Structure

```
~/codex/
├── landing/
│   └── index.html              # Workspace selector
├── users/
│   ├── user1/                  # Workspace 1 (mounted in container)
│   ├── user2/                  # Workspace 2
│   └── ...
└── docker/
    ├── Dockerfile              # Auto-generated
    └── start-workspaces.sh     # Container startup script
```

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
# Option 2: Cleanup Only
# Option 3: Local Network Mode (LAN)
```

All configuration via interactive prompts or environment variables (`CODEX_NUM_USERS`, `CODEX_DOMAIN`).

---

## 📜 License

See [LICENSE](LICENSE) file for details.

## 👥 Credits

**Developed by [BufferRing](https://github.com/BufferRing)**  
Website: [bufferring.org](https://bufferring.org)

**Community Project:** This is an open-source educational tool made freely available to students and teachers. It is not officially endorsed by or affiliated with any institution or government entity.

