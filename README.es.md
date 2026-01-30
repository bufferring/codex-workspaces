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

# UNEFA Codex - Sistema de Espacios de Trabajo Dockerizados con Code-Server

![Versión](https://img.shields.io/badge/versión-3.0.0-blue.svg)
![Shell](https://img.shields.io/badge/shell-bash-green.svg)
![Licencia](https://img.shields.io/badge/licencia-MIT-orange.svg)
![Plataforma](https://img.shields.io/badge/plataforma-ubuntu%2022.04-purple.svg)
![Docker](https://img.shields.io/badge/docker-20.10+-2496ED.svg?logo=docker&logoColor=white)

**Idiomas:** [🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md)

Un sistema listo para producción que ejecuta múltiples espacios de trabajo aislados de code-server usando Docker, Nginx y Tailscale.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      SISTEMA HOST                            │
│                                                               │
│  ┌──────────────┐         ┌─────────────────────────────┐   │
│  │   Tailscale  │────────▶│          Nginx              │   │
│  │    Funnel    │         │      (Puerto 80)            │   │
│  │  (Público)   │         │                             │   │
│  └──────────────┘         │  / → Página de Inicio       │   │
│                           │  /user1/ → 127.0.0.1:8081   │   │
│                           │  /user2/ → 127.0.0.1:8082   │   │
│                           │  ...                         │   │
│                           │  /user20/ → 127.0.0.1:8100  │   │
│                           └─────────────────────────────┘   │
│                                      │                       │
│                                      ▼                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      CONTENEDOR DOCKER (codex-workspaces)              │ │
│  │                                                         │ │
│  │  ┌──────────┐  ┌──────────┐       ┌──────────┐        │ │
│  │  │ user1    │  │ user2    │  ...  │ user20   │        │ │
│  │  │ :8081    │  │ :8082    │       │ :8100    │        │ │
│  │  │code-     │  │code-     │       │code-     │        │ │
│  │  │server    │  │server    │       │server    │        │ │
│  │  └──────────┘  └──────────┘       └──────────┘        │ │
│  │                                                         │ │
│  │  Todos los espacios en UN contenedor                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     ~/codex/users/ (Almacenamiento Persistente)        │ │
│  │                                                         │ │
│  │  user1/  user2/  user3/  ...  user20/                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Componentes:** Nginx (proxy inverso) + Tailscale (exposición pública) en host → Contenedor Docker con instancias de code-server → Almacenamiento persistente

---

## 🚀 Inicio Rápido

### Prerequisitos
- Docker, Nginx, Tailscale (autenticado)
- `curl`, `unzip`
- Ubuntu 22.04 LTS recomendado

### Instalación

```bash
chmod +x codex-setup.sh
sudo ./codex-setup.sh
```

**Se te pedirá elegir:**
1. **Configuración Completa (Tailscale acceso público):** URL pública a través de Tailscale (`https://app.ts.net`)
2. **Configuración Red Local (solo LAN):** Acceso por IP de la red (`http://192.168.x.x`)
3. **Desinstalar (Eliminar todo):** Elimina servicios Codex, datos y configuraciones

### Modos de Uso

**Opción 1: Configuración Completa (Tailscale acceso público)**
- HTTPS seguro mediante funnel de Tailscale
- Accesible desde cualquier lugar con tu cuenta Tailscale
- Solicita un dominio tipo `miapp.ts.net`

**Opción 2: Configuración Red Local (solo LAN)**
- HTTP estándar servido únicamente en la red local
- Detecta automáticamente la IP del servidor (editable si es necesario)
- No requiere Tailscale ni internet; acceso via `http://<IP-SERVIDOR>/`

**Opción 3: Desinstalar (Eliminar todo)**
- Detiene servicios systemd y elimina contenedor/imagen Docker
- Borra configuración de Nginx, datos de usuarios y archivos auxiliares
- Obliga a escribir `YES` para confirmar la eliminación irreversible

### Instalación No Interactiva (CI/CD)

```bash
export CODEX_NUM_USERS=15
export CODEX_DOMAIN="myapp.ts.net"
sudo -E ./codex-setup.sh
```

---

## 💻 Lenguajes Pre-instalados

| Lenguaje | Versión | Herramientas |
|----------|---------|--------------|
| **Python** | 3.10+ | pip, venv, pipenv, poetry, black, flake8 |
| **Node.js** | 22.12.0 LTS (NVM) | Bun (recomendado), npm, yarn, pnpm, TypeScript, ESLint, Prettier, nodemon |
| **Node.js (Actual)** | 24.x Current | Disponible vía NVM (`nvm use 24`) |
| **Go** | 1.25.5 | go mod, go build, go test |
| **Rust** | Última (rustup) | cargo, rustc |
| **C++** | Toolchain GCC | g++, make, build-essential |
| **C#** | .NET SDK 8.0 | CLI `dotnet`, plantillas de consola/web |

**También incluye:** Git, build-essential, gcc/g++, wget, curl, code-server, perfiles NVM, administrador de cargas de .NET

**Proyectos soportados:** React, Vue, Flask, Django, Express, FastAPI, APIs REST, herramientas CLI, ciencia de datos, y más

---

## 🔐 Credenciales de Espacios de Trabajo

- Espacio de trabajo 1: `user1` / `user1-pass`
- Espacio de trabajo 2: `user2` / `user2-pass`
- ...y así sucesivamente

---

## 🛡️ Seguridad y Aislamiento

**Aislamiento por Usuario Unix:**
- Cada espacio de trabajo se ejecuta como usuario Linux dedicado (`user1`-`user30`)
- Sin acceso root dentro de los espacios de trabajo
- Los usuarios pueden VER otros espacios (solo lectura) pero NO PUEDEN ELIMINAR archivos fuera del suyo

**Permisos:**
- Propio espacio: Lectura/escritura/eliminación completa
- Otros espacios: Solo lectura
- Archivos del sistema: Solo lectura

**Pruébalo:**
```bash
docker exec -it codex-workspaces su - user1
whoami  # Muestra: user1
rm /bin/ls  # Permiso denegado
```

---

## 🎛️ Administración

### Ver Estado
```bash
systemctl status codex-workspaces
docker ps | grep codex
```

### Reiniciar Servicios
```bash
sudo systemctl restart codex-workspaces
```

### Ver Registros
```bash
docker logs -f codex-workspaces
journalctl -xeu codex-workspaces
```

### Desinstalación Completa
```bash
sudo ./codex-setup.sh
# Elige opción 3: Desinstalar (Eliminar todo)
# Escribe 'YES' para confirmar
```

**Lo que se elimina:**
- Todos los datos de espacios de trabajo
- Contenedor e imagen Docker
- Configuraciones de Nginx
- Servicios systemd
- Tailscale funnel

---

## 🔧 Configuración

Edita las variables antes de la instalación o usa variables de entorno:

```bash
CODEX_NUM_USERS=25        # Número de espacios (1-30)
CODEX_DOMAIN="app.ts.net" # Tu dominio Tailscale
```

**Para cambiar configuración:** Vuelve a ejecutar el script con nuevos valores. La limpieza es automática.

---

## 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| Contenedor no ejecutándose | `sudo systemctl restart codex-workspaces` |
| Error 502 Bad Gateway | Verifica que el contenedor esté activo: `docker ps` |
| Conflictos de puertos | Verifica que los puertos 8081-81XX estén disponibles |
| Errores de permisos | Los espacios se ejecutan como usuarios Unix (por diseño) |

**Ver registros:**
```bash
docker logs --tail 50 codex-workspaces
journalctl -xeu codex-workspaces --no-pager -n 50
```

---

## 📊 Compatibilidad

| Componente | Requisito |
|-----------|-----------|
| **SO** | Ubuntu 22.04 LTS |
| **Docker** | 20.10+ |
| **Nginx** | 1.18+ |
| **Tailscale** | Cualquier versión reciente |

**Versión:** v3.0.0 (Seguridad Mejorada)  
**Lanzamiento:** Diciembre 2025

### Actualización desde v1.x

```bash
# Respaldar datos (opcional)
sudo cp -r ~/codex/users ~/codex-backup

# Ejecutar instalación (limpieza automática)
sudo ./codex-setup.sh
```

**Cambios importantes:** Aislamiento por usuario Unix agregado en v3.0.0

---

## 📂 Estructura del Repositorio

```
codex-workspaces/
├── codex-setup.sh          # Script principal de instalación/orquestación
├── src/                    # UI React + Tailwind del asistente de escritorio
├── public/                 # Recursos estáticos (workspaces.json, manifest, iconos)
├── src-tauri/              # Backend Tauri en Rust y configuración de empaquetado
├── dist/                   # Salida de Vite (generada)
├── node_modules/           # Dependencias del proyecto (generadas)
├── package.json            # Manifiesto del workspace Vite/Tauri
├── tailwind.config.js      # Tokens de diseño Tailwind
├── vite.config.ts          # Configuración de Vite + PWA
├── README.md               # Documentación en inglés
└── README.es.md            # Documentación en español
```

### Diseño aprovisionado en el host

Tras ejecutar `codex-setup.sh`, el servidor queda organizado bajo `~/codex/`:

```
~/codex/
├── landing/                # Selector de espacios servido por Nginx
├── users/                  # Directorios home user1 … userN
└── docker/                 # Dockerfile y scripts generados automáticamente
```

---

## 🖥️ Aplicación de Escritorio

El asistente de escritorio integrado simplifica la ejecución de `codex-setup.sh` y el acceso a los espacios.

### Requisitos

- Bun (recomendado) o Node.js 18+ con npm disponible
- Toolchain de Rust + `cargo install tauri-cli`

### Instalar dependencias

```bash
bun install
```

### Desarrollo

```bash
# Ejecuta Vite + Tauri juntos
bun run tauri:dev

# Vista previa solo en navegador (opcional)
bun run dev
```

La interfaz usa por defecto la copia de `codex-setup.sh` en la raíz del repositorio. Ajusta el campo de ruta si decides moverlo.

### Construir paquetes de escritorio

```bash
# Compila los assets de producción
bun run build

# Genera bundles para Linux (AppImage, deb, rpm) y el binario
bun run tauri:build

# Genera solo el ejecutable Linux (sin AppImage/deb/rpm)
bun run tauri build --bundles none
```

Los ejecutables quedan en `src-tauri/target/release/`.

---

## 🌐 Red y Puertos

- **Nginx:** Puerto 80 (host)
- **Code-server:** Puertos 8081-81XX (dentro del contenedor, usando `--network host`)
- **Tailscale:** HTTPS vía funnel

---

## 📖 Recursos Adicionales

**Script Principal:**
- `codex-setup.sh` - Multi-modo: Completa (1), Limpieza (2), o Local (3)

**Uso:**
```bash
sudo ./codex-setup.sh
# Opción 1: Configuración Completa (Tailscale)
# Opción 2: Modo Red Local (solo LAN)
# Opción 3: Desinstalar (Eliminar todo)
```

Toda la configuración vía prompts interactivos o variables de entorno (`CODEX_NUM_USERS`, `CODEX_DOMAIN`).

---

## 📜 Licencia

Licencia MIT - Copyright (c) 2025 Buffer Ring Organization

Ver archivo [LICENSE](LICENSE) para más detalles.

## 👥 Créditos

**Desarrollado por [BufferRing](https://github.com/BufferRing)**  
Sitio web: [bufferring.org](https://bufferring.org)

**Proyecto Comunitario:** Esta es una herramienta educativa de código abierto puesta a disposición gratuita de estudiantes y profesores. No está oficialmente respaldada ni afiliada a ninguna institución o entidad gubernamental.

