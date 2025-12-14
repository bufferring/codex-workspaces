#!/bin/bash
set -e

# UNEFA Codex - Dockerized Workspace Setup Script
# Version: 2.0 (Security-Enhanced)
# Compatible with: Ubuntu 22.04 LTS, Docker 20.10+, Nginx 1.18+
# 
# Copyright (c) 2025 BufferRing Organization
# Licensed under MIT License
# Website: https://bufferring.org | GitHub: @BufferRing
#
# This script sets up the entire UNEFA Codex system with Docker-based workspaces:
# - Nginx and Tailscale run on the host
# - All code-server workspaces run in a single Docker container with Unix user isolation

cat << 'CODEX_BANNER'
██╗   ██╗███╗   ██╗███████╗███████╗ █████╗      ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
██║   ██║████╗  ██║██╔════╝██╔════╝██╔══██╗    ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██╔██╗ ██║█████╗  █████╗  ███████║    ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██║    ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝██║ ╚████║███████╗██║     ██║  ██║    ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝     ╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
                                                                                        

        Dockerized Workspace Setup (Security-Enhanced)
        Tailscale • Nginx • code-server • Multi-user
==================================================
CODEX_BANNER



echo ""
echo "=================================================="
echo "CODEX — Dockerized Workspace Setup"
echo "Security-Enhanced • Tailscale • Nginx • code-server"
echo "Copyright © 2025 BufferRing Organization"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ This script must be run as root"
   echo "Run as: sudo ./codex-setup.sh"
   exit 1
fi

# Get the actual user (not root) who invoked sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
    echo "❌ Cannot determine actual user. Please run with sudo as a regular user."
    exit 1
fi

ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

# Mode selection
echo ""
echo "Select operation mode:"
echo "  1) Full Setup (Tailscale Public Access)"
echo "  2) Uninstall (Delete everything)"
echo "  3) Local Network Setup (LAN only, no internet required)"
echo ""
read -p "Enter your choice (1-3): " MODE_CHOICE

case $MODE_CHOICE in
    2)
        # CLEANUP MODE
        echo ""
    echo "=================================================="
    echo "🗑️ UNINSTALL MODE (Delete everything)"
    echo "=================================================="
        
        CODEX_HOME="$ACTUAL_HOME/codex"
        DOCKER_IMAGE="codex-workspace"
        DOCKER_CONTAINER="codex-workspaces"
        
        echo ""
    echo "⚠️  WARNING: This will permanently delete:"
        echo "  - All workspace data ($CODEX_HOME)"
        echo "  - Docker container and image"
        echo "  - Nginx configurations"
        echo "  - Systemd services"
        echo ""
        read -p "Type 'YES' to confirm deletion: " CONFIRM
        
        if [ "$CONFIRM" != "YES" ]; then
            echo "❌ Uninstall cancelled"
            exit 0
        fi
        
        echo ""
    echo "🗑️ Starting uninstall..."
        
        systemctl stop codex-workspaces nginx 2>/dev/null || true
        systemctl disable codex-workspaces 2>/dev/null || true
        
        docker stop $DOCKER_CONTAINER 2>/dev/null || true
        docker rm $DOCKER_CONTAINER 2>/dev/null || true
        docker rmi $DOCKER_IMAGE 2>/dev/null || true
        docker image prune -f 2>/dev/null || true
        
        if [ -d "$CODEX_HOME/users" ]; then
            chown -R root:root $CODEX_HOME/users 2>/dev/null || true
        fi
        rm -rf $CODEX_HOME
        rm -rf /etc/nginx/sites-available/codex
        rm -rf /etc/nginx/sites-enabled/codex
        rm -f /etc/systemd/system/codex*
        systemctl daemon-reload
        rm -f /etc/sudoers.d/codex-tailscale
        tailscale funnel reset 2>/dev/null || true
        
        echo ""
    echo "✅ Uninstall complete!"
    echo "To reinstall: sudo ./codex-setup.sh (choose option 1)"
        exit 0
        ;;
    1)
        echo ""
        echo "=================================================="
        echo "🚀 FULL SETUP MODE (Tailscale)"
        echo "=================================================="
        PROTOCOL="https"
        IS_LOCAL=false
        ;;
    3)
        echo ""
        echo "=================================================="
        echo "🏠 LOCAL NETWORK MODE"
        echo "=================================================="
        
        # Detect Local IP
        LOCAL_IP=$(hostname -I | awk '{print $1}')
        if [ -z "$LOCAL_IP" ]; then
            echo "❌ Could not detect local IP address."
            read -p "Enter your server's LAN IP address manually: " LOCAL_IP
        fi
        
        echo "✅ Detected Local IP: $LOCAL_IP"
        echo "ℹ️  Workspaces will be accessible via: http://$LOCAL_IP/"
        
        PROTOCOL="http"
        IS_LOCAL=true
        DOMAIN="$LOCAL_IP"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
echo ""

# Interactive prompt for number of workspaces (with env var fallback)
if [ -z "$CODEX_NUM_USERS" ]; then
    while true; do
        read -p "How many workspaces do you want? (1-30) [default: 20]: " NUM_USERS
        NUM_USERS=${NUM_USERS:-20}  # Default to 20 if empty
        
        if [[ "$NUM_USERS" =~ ^[0-9]+$ ]] && [ "$NUM_USERS" -ge 1 ] && [ "$NUM_USERS" -le 30 ]; then
            break
        else
            echo "❌ Please enter a number between 1 and 30"
        fi
    done
else
    NUM_USERS=$CODEX_NUM_USERS
    echo "Using environment variable: NUM_USERS=$NUM_USERS"
fi

# Interactive prompt for domain (if not local mode)
if [ "$IS_LOCAL" = "false" ] && [ -z "$CODEX_DOMAIN" ]; then
    while true; do
        read -p "Enter your Tailscale funnel domain (e.g., myapp.ts.net): " DOMAIN
        
        if [ -z "$DOMAIN" ]; then
            echo "❌ Domain cannot be empty"
            continue
        fi
        
        # Warn if not a Tailscale domain
        if [[ ! "$DOMAIN" =~ \.ts\.net$ ]]; then
            echo "⚠️  Warning: Domain doesn't end with .ts.net (Tailscale funnel requirement)"
            read -p "Continue anyway? (y/n): " confirm
            if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                break
            fi
        else
            break
        fi
    done
else
    if [ "$IS_LOCAL" = "false" ]; then
        DOMAIN=$CODEX_DOMAIN
        echo "Using environment variable: DOMAIN=$DOMAIN"
    fi
fi

echo ""
echo "=================================================="
echo "📋 Configuration Summary"
echo "=================================================="

# Configuration
CODEX_HOME="$ACTUAL_HOME/codex"
BASE_PORT=8081
DOCKER_IMAGE="codex-workspace"
DOCKER_CONTAINER="codex-workspaces"

echo "   User: $ACTUAL_USER"
echo "   Home Directory: $CODEX_HOME"
echo "   Number of Workspaces: $NUM_USERS"
echo "   Base Port: $BASE_PORT"
echo "   Port Range: $BASE_PORT-$((BASE_PORT + NUM_USERS - 1))"
echo "   Domain: $DOMAIN"
echo "   Docker Image: $DOCKER_IMAGE"
echo "   Docker Container: $DOCKER_CONTAINER"
echo ""

# Step 1: Complete System Cleanup
echo "🧹 Step 1: Complete System Cleanup"
echo "   Stopping existing services..."
systemctl stop codex-workspaces nginx 2>/dev/null || true
systemctl disable codex-workspaces nginx 2>/dev/null || true

echo "   Stopping and removing Docker container..."
docker stop $DOCKER_CONTAINER 2>/dev/null || true
docker rm $DOCKER_CONTAINER 2>/dev/null || true
docker rmi $DOCKER_IMAGE 2>/dev/null || true

echo "   Removing previous configurations..."
rm -rf $CODEX_HOME
rm -rf /etc/nginx/sites-available/codex
rm -rf /etc/nginx/sites-enabled/codex
rm -f /etc/systemd/system/codex*
rm -f $ACTUAL_HOME/.terraform.d/*
rm -f /usr/local/bin/terraform-provider-docker*
rm -f /usr/local/bin/tofu

echo "✅ Step 1 complete!"
echo ""

# Step 2: Create Directory Structure
echo "📂 Step 2: Create Directory Structure"
mkdir -p $CODEX_HOME/{landing,users,docker}
chown -R $ACTUAL_USER:$ACTUAL_USER $CODEX_HOME
chmod -R 755 $CODEX_HOME
echo "✅ Step 2 complete!"
echo ""

# Step 3: Create Landing Page
echo "🌐 Step 3: Create Landing Page"
cat > $CODEX_HOME/landing/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UNEFA Codex - Tu Espacio de Trabajo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --azul-medio: #040d9f;
            --zafre: #030ba6;
            --amarillo-americano: #ffd300;
            --lago-permanente: #d92929;
            --transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--zafre), var(--azul-medio));
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            position: relative;
        }
        
        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(255,255,255,0.05) 0%, transparent 20%),
                radial-gradient(circle at 90% 80%, rgba(255,255,255,0.05) 0%, transparent 20%);
            z-index: -1;
        }
        
        .preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--zafre), var(--azul-medio));
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            transition: opacity 0.8s ease, visibility 0.8s ease;
        }
        
        .logo-container {
            position: relative;
            width: 150px;
            height: 150px;
            margin-bottom: 30px;
        }
        
        .logo-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 15px rgba(255,211,0,0.6));
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .loading-text {
            color: var(--amarillo-americano);
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 1px;
            margin-top: 15px;
            opacity: 1;
            text-shadow: 0 0 10px rgba(255,211,0,0.5);
            text-align: center;
            animation: fadeInUp 0.6s ease-out;
        }
        
        .loading-bar {
            width: 250px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 25px;
            overflow: hidden;
            position: relative;
        }
        
        .loading-progress {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%;
            background: var(--amarillo-americano);
            border-radius: 2px;
            box-shadow: 0 0 10px var(--amarillo-americano);
        }
        
        .ripple-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--zafre), var(--azul-medio));
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.5s ease;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: var(--amarillo-americano);
            transform: scale(0);
            animation: ripple 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
            width: 95%;
            max-width: 450px;
            padding: 45px 35px;
            text-align: center;
            position: relative;
            overflow: hidden;
            transform: translateY(30px);
            opacity: 0;
            transition: var(--transition);
        }
        
        .container.visible {
            transform: translateY(0);
            opacity: 1;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, var(--amarillo-americano), var(--lago-permanente));
        }
        
        .logo {
            margin-bottom: 25px;
        }
        
        .logo img {
            max-width: 150px;
            height: auto;
            filter: drop-shadow(0 0 8px rgba(0,0,0,0.1));
        }
        
        .header h1 {
            color: var(--zafre);
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
            background: linear-gradient(90deg, var(--zafre), var(--amarillo-americano));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            color: var(--azul-medio);
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .form-group {
            margin-bottom: 25px;
            text-align: left;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--zafre);
            font-size: 16px;
            font-weight: 600;
        }
        
        .form-control {
            width: 100%;
            padding: 14px 18px;
            border: 2px solid rgba(3, 11, 166, 0.2);
            border-radius: 14px;
            font-size: 16px;
            transition: var(--transition);
        }
        
        .form-control:focus {
            outline: none;
            border-color: var(--amarillo-americano);
            box-shadow: 0 0 0 3px rgba(255, 211, 0, 0.2);
        }
        
        .login-btn {
            background: linear-gradient(90deg, var(--amarillo-americano), var(--lago-permanente));
            color: white;
            border: none;
            width: 100%;
            padding: 14px;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            transition: var(--transition);
            margin-top: 10px;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(217, 41, 41, 0.45);
        }
        
        .footer {
            margin-top: 25px;
            color: var(--zafre);
            font-size: 13px;
            opacity: 0.8;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes ripple {
            0% {
                transform: scale(0);
                opacity: 0.8;
            }
            100% {
                transform: scale(15);
                opacity: 0;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 35px 25px;
                margin: 15px;
            }
            
            .logo img {
                max-width: 120px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .logo-container {
                width: 120px;
                height: 120px;
            }
            
            .loading-bar {
                width: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="background-pattern"></div>
    
    <div class="preloader" id="preloader">
        <div class="logo-container">
            <img src="https://i.postimg.cc/Zn1BNPLg/UNEFA.png" alt="UNEFA Codex Logo">
        </div>
        <div class="loading-text" id="loading-text">Cargando UNEFA Codex</div>
        <div class="loading-bar">
            <div class="loading-progress" id="loading-progress"></div>
        </div>
    </div>
    
    <div class="ripple-container" id="ripple-container">
        <div class="ripple"></div>
    </div>
    
    <div class="container" id="main-container">
        <div class="logo">
            <img src="https://i.postimg.cc/Zn1BNPLg/UNEFA.png" alt="UNEFA Codex Logo">
        </div>
        
        <div class="header">
            <h1>UNEFA Codex</h1>
            <div class="subtitle">Tu Espacio de Trabajo</div>
        </div>
        
        <form id="workspace-form">
            <div class="form-group">
                <label for="workspace">Selecciona tu Workspace</label>
                <select id="workspace" class="form-control" required>
                    <option value="">-- Elige un workspace --</option>
EOF

# Generate workspace options dynamically based on NUM_USERS
for i in $(seq 1 $NUM_USERS); do
    cat >> $CODEX_HOME/landing/index.html << EOF
                    <option value="user$i">Workspace $i</option>
EOF
done

cat >> $CODEX_HOME/landing/index.html << EOF
                </select>
            </div>
            
            <button type="submit" class="login-btn">
                <i class="fas fa-door-open" style="margin-right: 10px;"></i>ACCEDER AL WORKSPACE
            </button>
        </form>
        
        <div class="footer">
            <p>UNEFA Codex - Entorno de Desarrollo Seguro</p>
            <p style="margin-top: 5px; font-size: 12px; opacity: 0.7;">© 2025 Universidad Nacional Experimental Politécnica de la Fuerza Armada</p>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const preloader = document.getElementById('preloader');
            const rippleContainer = document.getElementById('ripple-container');
            const mainContainer = document.getElementById('main-container');
            const loadingProgress = document.getElementById('loading-progress');
            const loadingText = document.getElementById('loading-text');
            
            let textPhase = 0;
            const loadingTexts = ["Cargando UNEFA Codex", "Pensando...", "Cargando UNEFA Codex", "Preparando espacio..."];
            
            loadingText.textContent = loadingTexts[textPhase];
            
            setInterval(() => {
                textPhase = (textPhase + 1) % loadingTexts.length;
                loadingText.textContent = loadingTexts[textPhase];
                
                if (loadingTexts[textPhase] === "Pensando...") {
                    loadingText.style.animation = "none";
                    setTimeout(() => {
                        loadingText.style.animation = "fadeInUp 0.3s ease-in-out";
                    }, 10);
                }
            }, 2000);
            
            let progress = 0;
            const loadingInterval = setInterval(() => {
                progress += Math.random() * 8;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(loadingInterval);
                    
                    setTimeout(() => {
                        preloader.style.opacity = '0';
                        preloader.style.visibility = 'hidden';
                        
                        setTimeout(() => {
                            rippleContainer.style.opacity = '1';
                            rippleContainer.style.visibility = 'visible';
                            createRippleEffect();
                            
                            setTimeout(() => {
                                rippleContainer.style.opacity = '0';
                                rippleContainer.style.visibility = 'hidden';
                                mainContainer.classList.add('visible');
                            }, 600);
                        }, 300);
                    }, 800);
                }
                loadingProgress.style.width = \`\${Math.min(progress, 100)}%\`;
            }, 250);
            
            function createRippleEffect() {
                const container = document.getElementById('ripple-container');
                container.innerHTML = '';
                
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const newRipple = document.createElement('div');
                        newRipple.className = 'ripple';
                        container.appendChild(newRipple);
                    }, i * 150);
                }
            }
            
            document.getElementById('workspace-form').addEventListener('submit', function(e) {
                e.preventDefault();
                e.preventDefault();
                const workspace = document.getElementById('workspace').value;
                window.location.href = '${PROTOCOL}://${DOMAIN}/' + workspace + '/';
            });
            
            setTimeout(() => {
                document.querySelector('.logo-container').style.animation = 'pulse 2s infinite';
            }, 300);
        });
    </script>
</body>
</html>
EOF
echo "✅ Step 3 complete!"
echo ""

# Step 4: Create Nginx Configuration
echo "⚙️ Step 4: Create Nginx Configuration"
tee /etc/nginx/sites-available/codex > /dev/null << EOF
# UNEFA Codex - Path-based configuration
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 0;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Landing page
    location / {
        root $CODEX_HOME/landing;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # User workspace routes (path-based) - proxies to Docker container
EOF

# Add user routes dynamically
for i in $(seq 1 $NUM_USERS); do
    PORT=$((BASE_PORT + i - 1))
    tee -a /etc/nginx/sites-available/codex > /dev/null << EOF
    location /user$i/ { proxy_pass http://127.0.0.1:$PORT/; include proxy_params; }
EOF
done

tee -a /etc/nginx/sites-available/codex > /dev/null << EOF
}
EOF
echo "✅ Step 4 complete!"
echo ""

# Step 5: Create proxy_params File
echo "🔧 Step 5: Create proxy_params File"
tee /etc/nginx/proxy_params > /dev/null << 'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_buffering off;
proxy_read_timeout 86400s;
EOF
echo "✅ Step 5 complete!"
echo ""

# Step 6: Create Dockerfile embedded in this script
echo "🐳 Step 6: Create Docker Image for Workspaces"

cat > $CODEX_HOME/docker/Dockerfile << DOCKERFILE_HEAD
FROM ubuntu:22.04

# Build argument for number of users
ARG NUM_USERS=${NUM_USERS}
DOCKERFILE_HEAD

cat >> $CODEX_HOME/docker/Dockerfile << 'DOCKERFILE_EOF'

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and code-server
RUN apt-get update && \
    apt-get install -y \
    curl wget git build-essential sudo \
    python3 python3-pip python3-venv \
    ca-certificates gnupg && \
    curl -fsSL https://code-server.dev/install.sh | sh && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Golang
ENV GOLANG_VERSION=1.25.5
RUN wget https://go.dev/dl/go${GOLANG_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GOLANG_VERSION}.linux-amd64.tar.gz && \
    rm go${GOLANG_VERSION}.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/root/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# Install NVM and Node.js
ENV NVM_DIR="/root/.nvm"
ENV NODE_VERSION=22.12.0
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash && \
    bash -lc ". \"$NVM_DIR/nvm.sh\" && nvm install ${NODE_VERSION} && nvm alias default ${NODE_VERSION} && nvm use default" && \
    echo 'export NVM_DIR="$HOME/.nvm"' >> /etc/profile.d/nvm.sh && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> /etc/profile.d/nvm.sh && \
    echo '[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"' >> /etc/profile.d/nvm.sh
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin:${PATH}"

# Install common development tools
RUN pip3 install --no-cache-dir pipenv poetry black flake8 pylint flask Django && \
    npm install -g yarn pnpm typescript nodemon eslint prettier

# Install .NET SDK (C#) for Ubuntu 22.04
RUN apt-get update && \
    apt-get install -y software-properties-common && \
    wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create workspace directory
RUN mkdir -p /workspaces

# Create users for workspaces
RUN for i in $(seq 1 ${NUM_USERS}); do \
        useradd -m -s /bin/bash -u $((1000 + i)) user$i && \
        mkdir -p /workspaces/user$i && \
        chown user$i:user$i /workspaces/user$i; \
    done

# Set proper permissions - users can only write to their own workspace
RUN chmod 755 /workspaces

# Make code-server accessible to all users
RUN chmod -R o+rx /usr/lib/code-server

# Copy startup script (will be created next)
COPY start-workspaces.sh /start-workspaces.sh
RUN chmod +x /start-workspaces.sh

# Expose ports for all users
DOCKERFILE_EOF

# Append dynamic EXPOSE instruction based on number of users
MAX_PORT=$((BASE_PORT + NUM_USERS - 1))
echo "EXPOSE $BASE_PORT-$MAX_PORT" >> $CODEX_HOME/docker/Dockerfile

cat >> $CODEX_HOME/docker/Dockerfile << 'DOCKERFILE_EOF'

CMD ["/start-workspaces.sh"]
DOCKERFILE_EOF

echo "✅ Step 6 complete!"
echo ""

# Step 7: Create Startup Script for Docker Container
echo "🚀 Step 7: Create Startup Script for Docker Workspaces"
cat > $CODEX_HOME/docker/start-workspaces.sh << SCRIPT_HEAD
#!/bin/bash
set -e

echo "🚀 Starting UNEFA Codex Workspaces in Docker..."

# Base port for user workspaces
BASE_PORT=${BASE_PORT}

# Number of users to set up (from setup configuration)
NUM_USERS=${NUM_USERS}

echo "Starting code-server instances for \$NUM_USERS users..."
SCRIPT_HEAD

cat >> $CODEX_HOME/docker/start-workspaces.sh << 'SCRIPT_EOF'

# Start code-server for each user
for i in $(seq 1 $NUM_USERS); do
    USER_DIR="/workspaces/user$i"
    PORT=$((BASE_PORT + i - 1))
    CONFIG_DIR="$USER_DIR/.config/code-server"
    DATA_DIR="$USER_DIR/.vscode-data"
    USERNAME="user$i"
    
    # Create user directory if not exists
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$DATA_DIR"
    
    # Set ownership to the specific user
    chown -R $USERNAME:$USERNAME "$USER_DIR"
    
    # Set permissions: owner full access, others read-only (can't delete)
    chmod -R 755 "$USER_DIR"
    
    # Create config file with password and user data directory
    PASSWORD="user$i-pass"
    
    cat > "$CONFIG_DIR/config.yaml" << EOF
bind-addr: 0.0.0.0:$PORT
auth: password
password: $PASSWORD
cert: false
user-data-dir: $DATA_DIR
EOF
    
    chown $USERNAME:$USERNAME "$CONFIG_DIR/config.yaml"
    
    # Start code-server in background AS THE SPECIFIC USER (not root!)
    echo "Starting user$i workspace on port $PORT as user $USERNAME..."
    su - $USERNAME -c "/usr/bin/code-server \
        --config '$CONFIG_DIR/config.yaml' \
        --user-data-dir '$DATA_DIR' \
        '$USER_DIR'" &
    
    # Save PID for cleanup
    echo $! > "/tmp/code-server-user$i.pid"
    
    # Small delay to prevent startup race conditions
    sleep 0.5
done

echo "All \$NUM_USERS workspaces started!"
echo "Access them via your configured domain"
echo ""
echo "Or use the landing page to select a workspace"

# Keep the container running
tail -f /dev/null
SCRIPT_EOF

chmod +x $CODEX_HOME/docker/start-workspaces.sh
echo "✅ Step 7 complete!"
echo ""

# Step 8: Build Docker Image
echo "🔨 Step 8: Build Docker Image"
docker build --build-arg NUM_USERS=$NUM_USERS -t $DOCKER_IMAGE $CODEX_HOME/docker/
echo "✅ Step 8 complete!"
echo ""

# Step 9: Create Systemd Service for Docker Container
echo "⚙️ Step 9: Create Systemd Service for Docker Container"
tee /etc/systemd/system/codex-workspaces.service > /dev/null << EOF
[Unit]
Description=UNEFA Codex Dockerized Workspaces
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$CODEX_HOME
ExecStartPre=-/usr/bin/docker stop $DOCKER_CONTAINER
ExecStartPre=-/usr/bin/docker rm $DOCKER_CONTAINER
ExecStart=/usr/bin/docker run --name $DOCKER_CONTAINER \
    --network host \
    -v $CODEX_HOME/users:/workspaces \
    $DOCKER_IMAGE
ExecStop=/usr/bin/docker stop $DOCKER_CONTAINER
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
echo "✅ Step 9 complete!"
echo ""

# Step 10: Create Tailscale Funnel Setup Script
echo "🌐 Step 10: Create Tailscale Funnel Setup Script"
cat > $CODEX_HOME/setup-funnel.sh << 'FUNNEL_EOF'
#!/bin/bash
set -e

echo "🚀 Setting up Tailscale funnel for UNEFA Codex..."

# Get configuration from parent script
DOMAIN="$DOMAIN"
NUM_USERS=$NUM_USERS

# Reset existing funnel
echo "🔄 Resetting Tailscale funnel..."
tailscale funnel reset

# Expose root domain (landing page)
echo "🔌 Exposing landing page: https://$DOMAIN/"
tailscale serve --bg 80
tailscale funnel --bg 80

# Expose user workspaces as PATHS (not subdomains)
echo "🔌 Exposing user workspaces as paths..."
for i in $(seq 1 $NUM_USERS); do
    echo "   • /user${i} → workspace ${i}"
    tailscale serve --set-path "user${i}" 80
    tailscale funnel --set-path "user${i}" 80
done

echo ""
echo "✅ Tailscale funnel setup complete!"
echo ""
echo "🌐 Access your UNEFA Codex at:"
echo "   https://$DOMAIN/ (landing page)"
for i in $(seq 1 $NUM_USERS); do
    echo "   https://$DOMAIN/user${i}/ (workspace ${i})"
done
FUNNEL_EOF

chmod +x $CODEX_HOME/setup-funnel.sh
echo "✅ Step 10 complete!"
echo ""

# Step 11: Apply All Changes
echo "🚀 Step 11: Apply All Changes"

echo "   Creating user workspace directories..."
mkdir -p $CODEX_HOME/users
for i in $(seq 1 $NUM_USERS); do
    mkdir -p $CODEX_HOME/users/user$i
done

echo "   Setting proper permissions..."
chown -R $ACTUAL_USER:$ACTUAL_USER $CODEX_HOME
chmod -R 755 $CODEX_HOME

echo "   Enabling nginx configuration..."
ln -sf /etc/nginx/sites-available/codex /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "   Testing nginx configuration..."
nginx -t

echo "   Restarting nginx..."
systemctl restart nginx

echo "   Enabling and starting Docker workspaces service..."
systemctl daemon-reload
systemctl enable codex-workspaces
systemctl start codex-workspaces

echo "   Waiting for services to start (15 seconds)..."
sleep 15

echo "   Applying Tailscale funnel configuration..."
if [ "$IS_LOCAL" = "false" ]; then
    $CODEX_HOME/setup-funnel.sh
else
    echo "   🏠 Local Mode: Skipping Tailscale setup."
fi

echo "✅ Step 11 complete!"
echo ""

# Verification
echo "=================================================="
echo "✅ UNEFA Codex Dockerized Setup Complete!"
echo "=================================================="
echo ""
echo "🔍 Running verification checks..."
echo ""

echo "📊 Service Status:"
sudo systemctl status codex-workspaces nginx --no-pager | head -20

echo ""
echo "🐳 Docker Container Status:"
docker ps | grep $DOCKER_CONTAINER || echo "⚠️  Container not running"

echo ""
echo "🌐 Testing Landing Page:"
curl -I ${PROTOCOL}://$DOMAIN/ 2>&1 | grep -E "HTTP|Location" || echo "⚠️  Landing page test failed"

echo ""
echo "🔧 Testing User Workspace:"
curl -I ${PROTOCOL}://$DOMAIN/user1/ 2>&1 | grep -E "HTTP|Location" || echo "⚠️  User workspace test failed"

echo ""
if [ "$IS_LOCAL" = "false" ]; then
    echo "🔗 Tailscale Status:"
    tailscale status | head -5
fi

echo ""
echo "=================================================="
echo "🎯 UNEFA Codex is now operational!"
echo "=================================================="
echo ""
echo "Architecture:"
echo "  🏠 Host: Nginx + Tailscale"
echo "  🐳 Docker: All code-server workspaces in one container"
echo ""
echo "Access your system at:"
echo "  🌐 Landing Page: ${PROTOCOL}://$DOMAIN/"
echo ""
echo "User Workspaces:"
for i in $(seq 1 $NUM_USERS); do
    echo "  👤 Workspace $i: ${PROTOCOL}://$DOMAIN/user$i/ (Password: user$i-pass)"
done
echo ""
echo "📝 Important Notes:"
echo "  • All workspaces run in a single Docker container"
echo "  • Each workspace is isolated to its own directory"
echo "  • User data persists in $CODEX_HOME/users/"
echo "  • Nginx and Tailscale run on the host"
echo "  • System auto-restarts after reboot"
echo ""
echo "🔧 Useful Commands:"
echo "  • View container logs: docker logs -f $DOCKER_CONTAINER"
echo "  • Restart container: sudo systemctl restart codex-workspaces"
echo "  • Access container shell: docker exec -it $DOCKER_CONTAINER /bin/bash"
echo ""