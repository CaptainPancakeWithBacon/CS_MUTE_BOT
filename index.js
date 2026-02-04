require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const express = require('express');

const MUTE_DURATION = 3000;
const PLAYERS_FILE = path.join(__dirname, 'players.json');
const PORT = process.env.PORT || 3000;

// player data stuff
function loadPlayers() {
  try {
    if (fs.existsSync(PLAYERS_FILE)) {
      return JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf8'));
    }
  } catch (err) {
    console.log('couldnt load players.json:', err.message);
  }
  return {};
}

function savePlayers(players) {
  try {
    fs.writeFileSync(PLAYERS_FILE, JSON.stringify(players, null, 2));
  } catch (err) {
    console.log('couldnt save players.json:', err.message);
  }
}

let players = loadPlayers();
const playerStates = new Map();

// discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your Steam ID to get muted when you die')
    .addStringOption(opt => opt.setName('steam_id').setDescription('Your steamID64 from steamid.io').setRequired(true)),
  new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Remove yourself from the death muter'),
  new SlashCommandBuilder()
    .setName('players')
    .setDescription('Show registered players'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check if youre registered'),
].map(cmd => cmd.toJSON());

client.once('ready', async () => {
  console.log(`logged in as ${client.user.tag}`);

  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('slash commands registered');
  } catch (err) {
    console.log('failed to register commands:', err.message);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  if (commandName === 'register') {
    const steamId = interaction.options.getString('steam_id');

    if (!/^7656\d{13}$/.test(steamId)) {
      return interaction.reply({ content: 'thats not a valid steam id. use steamID64 from steamid.io (starts with 7656)', ephemeral: true });
    }

    const taken = Object.entries(players).find(([sid, did]) => sid === steamId && did !== user.id);
    if (taken) {
      return interaction.reply({ content: 'that steam id is already registered to someone else', ephemeral: true });
    }

    players[steamId] = user.id;
    savePlayers(players);
    console.log(`registered ${user.tag} -> ${steamId}`);
    return interaction.reply({ content: `registered! steam: \`${steamId}\``, ephemeral: true });
  }

  if (commandName === 'unregister') {
    const entry = Object.entries(players).find(([, did]) => did === user.id);
    if (!entry) {
      return interaction.reply({ content: 'youre not registered', ephemeral: true });
    }

    delete players[entry[0]];
    savePlayers(players);
    console.log(`unregistered ${user.tag}`);
    return interaction.reply({ content: 'unregistered', ephemeral: true });
  }

  if (commandName === 'players') {
    const entries = Object.entries(players);
    if (entries.length === 0) {
      return interaction.reply({ content: 'no one registered yet', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('registered players')
      .setColor(0x5865F2)
      .setDescription(`${entries.length} player(s)`);

    for (const [steamId, discordId] of entries) {
      const member = await interaction.guild.members.fetch(discordId).catch(() => null);
      embed.addFields({
        name: member?.user.tag || discordId,
        value: steamId,
        inline: true
      });
    }

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'status') {
    const entry = Object.entries(players).find(([, did]) => did === user.id);
    if (!entry) {
      return interaction.reply({ content: 'not registered. use /register', ephemeral: true });
    }
    return interaction.reply({ content: `registered with steam id: \`${entry[0]}\``, ephemeral: true });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// express server for gsi
const app = express();
app.use(express.json());

app.post('/', (req, res) => {
  res.status(200).end();

  const gs = req.body;
  if (!gs.player || !gs.provider) return;

  const steamId = gs.provider.steamid;
  const health = gs.player.state?.health ?? 100;
  const discordId = players[steamId];

  if (!discordId) return;

  const prev = playerStates.get(steamId) || { health: 100 };

  if (prev.health > 0 && health === 0) {
    console.log(`${steamId} died`);
    mutePlayer(discordId);
  }

  playerStates.set(steamId, { health });
});

async function mutePlayer(userId) {
  for (const guild of client.guilds.cache.values()) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member?.voice.channel) {
      console.log(`muting ${member.user.tag}`);
      await member.voice.setMute(true, 'died in cs2');

      setTimeout(async () => {
        try {
          await member.voice.setMute(false);
          console.log(`unmuted ${member.user.tag}`);
        } catch (e) {
          console.log(`couldnt unmute ${member.user.tag}:`, e.message);
        }
      }, MUTE_DURATION);

      break;
    }
  }
}

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  console.log(`${Object.keys(players).length} players registered`);
});

process.on('SIGINT', () => {
  console.log('shutting down');
  client.destroy();
  process.exit(0);
});
