# CS2 Discord Death Mover

Moves players to a "dead" voice channel when they die in CS2. They get moved back when the round ends.

## How It Works

1. Player dies in CS2 -> gets moved to dead channel
2. Round ends -> everyone moves back to their original channel

## Setup

See `HOST-SETUP.md` for full host setup instructions.

**Quick version:**
1. Create Discord bot at https://discord.com/developers/applications
2. Add bot token to `.env`
3. `npm install && npm start`
4. In Discord: `/setdeadchannel #dead`
5. Players register with `/register <steam_id>`

## Slash Commands

| Command | Description |
|---------|-------------|
| `/register <steam_id>` | Register to get moved when you die |
| `/unregister` | Remove yourself |
| `/players` | List registered players |
| `/status` | Check your registration |
| `/setdeadchannel #channel` | Set the dead channel (admin) |
| `/deadchannel` | Show current dead channel |

## For Friends

Share the `friend-config` folder. They just need to:
1. Run `install-gsi.bat`
2. Restart CS2
3. `/register <steam_id>` in Discord

## Requirements

- Node.js 16+
- Discord bot with `Move Members` and `View Channels` permissions
- CS2 with GSI config installed
- ngrok (for friends to connect remotely)
