# SSH Tunnel Local

## 1) Start the app on the remote machine

Development:

```bash
npm run dev:tunnel
```

Production:

```bash
npm run build
npm run start:tunnel
```

The app listens on `0.0.0.0:3000` for tunnel access.

## 2) Open local SSH tunnel from your machine

```bash
ssh -N -L 3000:127.0.0.1:3000 <user>@<remote-host>
```

Then open:

```text
http://127.0.0.1:3000
```

## 3) Optional custom local port

```bash
ssh -N -L 8080:127.0.0.1:3000 <user>@<remote-host>
```

Then open `http://127.0.0.1:8080`.

