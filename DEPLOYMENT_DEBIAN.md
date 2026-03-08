# Deploiement Debian VPS (securise)

## 1) Prerequis serveur

```bash
sudo apt update && sudo apt -y upgrade
sudo apt install -y ca-certificates curl ufw fail2ban nginx git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2) Durcissement systeme minimal

```bash
sudo adduser --system --group --home /opt/market-intelligence-platform market-intelligence
sudo mkdir -p /opt/market-intelligence-platform/current /etc/market-intelligence-platform
sudo chown -R market-intelligence:market-intelligence /opt/market-intelligence-platform
sudo chmod 750 /opt/market-intelligence-platform
sudo chmod 750 /etc/market-intelligence-platform
```

## 3) Deploiement application

```bash
cd /opt/market-intelligence-platform/current
sudo -u market-intelligence git clone <VOTRE_REPO> .
sudo -u market-intelligence npm ci
sudo -u market-intelligence npm run build
```

Creer `/etc/market-intelligence-platform/app.env`:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
```

Puis securiser:

```bash
sudo chown root:market-intelligence /etc/market-intelligence-platform/app.env
sudo chmod 640 /etc/market-intelligence-platform/app.env
```

## 4) Service systemd

```bash
sudo cp deploy/systemd/market-intelligence-platform.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now market-intelligence-platform
sudo systemctl status market-intelligence-platform
```

## 5) Reverse proxy Nginx

Copier `deploy/nginx/market-intelligence-platform.conf` vers `/etc/nginx/sites-available/market-intelligence-platform` puis:

```bash
sudo ln -s /etc/nginx/sites-available/market-intelligence-platform /etc/nginx/sites-enabled/market-intelligence-platform
sudo nginx -t
sudo systemctl reload nginx
```

## 6) TLS (recommande)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

## 7) Pare-feu et anti-bruteforce

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo systemctl enable --now fail2ban
```

## 8) Bonnes pratiques de securite

- Desactiver le login SSH root.
- Activer uniquement l'authentification SSH par cle.
- Garder le systeme et Node.js a jour.
- Ne jamais commiter de secrets (`.env`).
- Sauvegarder `/etc`, `/opt/market-intelligence-platform`, et certificats TLS.
- Superviser les journaux:
  - `journalctl -u market-intelligence-platform -f`
  - `sudo tail -f /var/log/nginx/error.log`

## 9) Option Docker (alternative)

```bash
docker build -t market-intelligence-platform:latest .
docker run -d --name market-intelligence-platform \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges \
  market-intelligence-platform:latest
```


