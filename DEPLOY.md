# Deploying Big-Dilly on Ubuntu with Nginx

This guide is for LLM Agents deploying big-dilly to an Ubuntu server with nginx already installed.

## Prerequisites

- Ubuntu 20.04+ server
- nginx installed and running
- Node.js 18+ and npm
- Git
- A domain name pointed to the server (optional but recommended for SSL)

## Step 1: Install Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify: should be 18.x or higher
```

## Step 2: Create Application User

```bash
sudo useradd -m -s /bin/bash bigdilly
sudo mkdir -p /var/www/big-dilly
sudo chown bigdilly:bigdilly /var/www/big-dilly
```

## Step 3: Clone and Build Application

```bash
sudo -u bigdilly bash -c '
cd /var/www/big-dilly
git clone https://github.com/jamesstopford/big-dilly.git .
npm install --production=false
npm run build
'
```

## Step 4: Create Environment File

```bash
sudo -u bigdilly bash -c 'cat > /var/www/big-dilly/.env << EOF
NODE_ENV=production
PORT=3000
EOF'
```

## Step 5: Initialize Database

```bash
sudo -u bigdilly bash -c 'cd /var/www/big-dilly && npm run db:init'
```

## Step 6: Create Systemd Service

```bash
sudo tee /etc/systemd/system/big-dilly.service > /dev/null << 'EOF'
[Unit]
Description=Big-Dilly Web Application
After=network.target

[Service]
Type=simple
User=bigdilly
Group=bigdilly
WorkingDirectory=/var/www/big-dilly
ExecStart=/usr/bin/node src/server/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable big-dilly
sudo systemctl start big-dilly
sudo systemctl status big-dilly  # Verify it's running
```

## Step 7: Configure Nginx Reverse Proxy

Create nginx site configuration:

```bash
sudo tee /etc/nginx/sites-available/big-dilly > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with actual domain or server IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
EOF
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/big-dilly /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 8: Configure Firewall (if UFW enabled)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw status
```

## Step 9: SSL with Let's Encrypt (Recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update the nginx config for HTTPS.

## Verification

1. Check service status: `sudo systemctl status big-dilly`
2. Check logs: `sudo journalctl -u big-dilly -f`
3. Health check: `curl http://localhost:3000/api/health`
4. Access via browser: `http://your-domain.com` or `https://your-domain.com`

## Maintenance Commands

```bash
# View logs
sudo journalctl -u big-dilly -f

# Restart application
sudo systemctl restart big-dilly

# Stop application
sudo systemctl stop big-dilly

# Update application
sudo -u bigdilly bash -c '
cd /var/www/big-dilly
git pull
npm install --production=false
npm run build
'
sudo systemctl restart big-dilly

# Database location
ls -la /var/www/big-dilly/data/

# Backup database
sudo cp /var/www/big-dilly/data/big-dilly.db /backup/big-dilly-$(date +%Y%m%d).db
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| Service won't start | `sudo journalctl -u big-dilly -n 50` |
| 502 Bad Gateway | Ensure big-dilly service is running: `systemctl status big-dilly` |
| Permission denied | Verify ownership: `ls -la /var/www/big-dilly` |
| Database errors | Check data directory exists: `ls -la /var/www/big-dilly/data/` |
| Port conflict | `sudo lsof -i :3000` |

## Architecture Summary

```
[Client] --> [Nginx:80/443] --> [Node.js:3000] --> [SQLite DB]
                  |
            (reverse proxy)
```

- **Nginx**: Handles SSL termination, static file caching, reverse proxy
- **Node.js**: Express server on port 3000, serves API and SPA
- **SQLite**: Database stored in `/var/www/big-dilly/data/big-dilly.db`
