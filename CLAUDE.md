# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install    # install dependencies
npm start      # run the bot (or: node index.js)
```

## Architecture

Single-file Node.js app (`index.js`) that runs two services simultaneously:

1. **Discord Bot** (discord.js) - Handles slash commands and mutes users in voice channels
2. **Express Server** (port 3000) - Receives CS2 Game State Integration webhooks

### Data Flow

CS2 sends player health data via HTTP POST to `/` -> Express server detects death (health drops to 0) -> Discord bot mutes the player for 3 seconds

### Player Registration

- Players register via `/register <steam_id>` slash command
- Mappings stored in `players.json` (Steam ID -> Discord User ID)
- The `players` object is kept in memory and synced to disk on changes

### Key Constants

- `MUTE_DURATION`: 3000ms (how long players stay muted)
- `PORT`: 3000 (configurable via .env)

## CS2 Game State Integration

The `gamestate_integration_discordmuter.cfg` file must be placed in the CS2 cfg folder. It tells CS2 to POST game state to the Express server.

For remote play, ngrok tunnels localhost:3000 to a public URL. Friends need the GSI config pointing to that URL.
