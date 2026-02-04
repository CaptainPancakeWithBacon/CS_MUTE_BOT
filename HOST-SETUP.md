# Host Setup Guide

Run this on your always-on laptop to host the bot for your friend group.

## One-Time Setup

### 1. Install Node.js

Download from https://nodejs.org (LTS version)

### 2. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application**, name it
3. Go to **Bot** in sidebar
4. Click **Reset Token**, copy it
5. Enable **Server Members Intent** under Privileged Gateway Intents
6. Go to **OAuth2** > **URL Generator**
7. Scopes: `bot`, `applications.commands`
8. Permissions: `Move Members`, `View Channels`
9. Copy URL, open it, add bot to your server

### 3. Configure Bot

```bash
cd CS_MUTE_BOT
cp .env.example .env
```

Edit `.env` and paste your bot token.

### 4. Install Dependencies

```bash
npm install
```

### 5. Install ngrok

1. Download from https://ngrok.com/download
2. Create free account at ngrok.com
3. Get auth token from dashboard
4. Run: `ngrok config add-authtoken YOUR_TOKEN`
5. (Optional) Get free static domain from ngrok dashboard > Cloud Edge > Domains

### 6. Update Friend Config

Edit `friend-config/gamestate_integration_discordmuter.cfg`:

Replace `YOUR_NGROK_URL_HERE` with your ngrok URL (e.g. `https://your-domain.ngrok-free.app`)

## Running the Bot

Open two terminals:

**Terminal 1 - Bot:**
```bash
npm start
```

**Terminal 2 - ngrok:**
```bash
ngrok http 3000
```

Or with static domain:
```bash
ngrok http --domain=your-domain.ngrok-free.app 3000
```

On Windows, just double-click `start-server.bat` and `start-ngrok.bat`.

## Discord Setup

1. Create a voice channel called "Dead" (or whatever)
2. Run `/setdeadchannel #dead`
3. Register yourself: `/register <your_steam_id>`

## Share With Friends

Send them the `friend-config` folder. They need to:
1. Run `install-gsi.bat`
2. Restart CS2
3. Type `/register <steam_id>` in Discord

Get Steam ID from https://steamid.io (use steamID64)

## Running 24/7

To keep it running after closing terminal:

**Linux:**
```bash
npm install -g pm2
pm2 start index.js --name cs2bot
pm2 save
pm2 startup
```

**Windows:**
- Use Task Scheduler to run on startup
- Or just leave the terminal windows open

## Troubleshooting

**Bot not responding to commands:**
- Wait a minute, global commands take time to register
- Check bot has correct permissions

**Friends not getting moved:**
- Check their GSI config has correct ngrok URL
- Make sure they restarted CS2
- Make sure they used `/register` with correct Steam ID
- Check the bot terminal for logs

**ngrok URL changed:**
- Update `friend-config/gamestate_integration_discordmuter.cfg`
- Friends need to reinstall (run `install-gsi.bat` again)
- Get a free static domain to avoid this
