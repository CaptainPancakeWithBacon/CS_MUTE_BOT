# CS2 Discord Auto-Muter

Automatically mutes your friends in Discord voice chat when they die in Counter-Strike 2.

## Features

- Real-time death detection using CS2 Game State Integration
- Automatic muting in Discord voice channels
- Configurable mute duration (default: 3 seconds)
- Multiple player support
- Automatic unmute after duration expires

## Prerequisites

- Node.js v16.9.0 or higher
- Counter-Strike 2
- A Discord bot with proper permissions
- Players must be in a Discord voice channel

## Setup

See `SETUP-GUIDE.txt` for full instructions.

Quick version:
1. `npm install`
2. Create Discord bot, add token to `.env`
3. Set up ngrok
4. Share `friend-config` folder with friends
5. Run `start-server.bat` and `start-ngrok.bat`

## Slash Commands

- `/register <steam_id>` - Register to get muted when you die
- `/unregister` - Remove yourself
- `/players` - List registered players
- `/status` - Check your registration

## Configuration

Change mute duration in `index.js`:
```javascript
const MUTE_DURATION = 3000; // milliseconds
```

## Troubleshooting

**Bot doesn't mute:**
- Check bot has "Mute Members" permission
- Bot's role must be higher than user's role
- User must be in voice channel

**CS2 not sending data:**
- Check GSI config is in correct folder
- Restart CS2 after adding config

**Can't find Steam ID:**
- Go to steamid.io, use the steamID64 format

## License

MIT
