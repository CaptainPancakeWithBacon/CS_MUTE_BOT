require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');

const PLAYERS_FILE = path.join(__dirname, 'players.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const PORT = process.env.PORT || 3000;

// player data
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

// config (dead channel per guild)
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (err) {
    console.log('couldnt load config.json:', err.message);
  }
  return { deadChannels: {} };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    console.log('couldnt save config.json:', err.message);
  }
}

let players = loadPlayers();
let config = loadConfig();
const playerStates = new Map();

// track dead players: visordId -> { visordId, originalChannelId, guildId }
const deadPlayers = new Map();
let lastRoundPhase = null;

// discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your Steam ID to get moved when you die')
    .addStringOption(opt => opt.setName('steam_id').setDescription('Your steamID64 from steamid.io').setRequired(true)),
  new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Remove yourself from the death mover'),
  new SlashCommandBuilder()
    .setName('players')
    .setDescription('Show registered players'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check if youre registered'),
  new SlashCommandBuilder()
    .setName('setdeadchannel')
    .setDescription('Set the channel where dead players get moved')
    .addChannelOption(opt => opt.setName('channel').setDescription('Voice channel for dead players').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder()
    .setName('deadchannel')
    .setDescription('Show the current dead channel'),
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

  if (commandName === 'setdeadchannel') {
    const channel = interaction.options.getChannel('channel');
    config.deadChannels[interaction.guildId] = channel.id;
    saveConfig(config);
    console.log(`dead channel set to ${channel.name} in ${interaction.guild.name}`);
    return interaction.reply({ content: `dead channel set to ${channel}`, ephemeral: true });
  }

  if (commandName === 'deadchannel') {
    const channelId = config.deadChannels[interaction.guildId];
    if (!channelId) {
      return interaction.reply({ content: 'no dead channel set. use /setdeadchannel', ephemeral: true });
    }
    return interaction.reply({ content: `dead channel: <#${channelId}>`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// express server for gsi
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', (req, res) => {
  res.status(200).end();

  const gs = req.body.data ? JSON.parse(req.body.data) : req.body;
  if (!gs.provider) return;

  const steamId = gs.provider.steamid;
  const discordId = players[steamId];
  if (!discordId) return;

  // check round phase - move everyone back when round ends
  const roundPhase = gs.round?.phase;
  if (roundPhase && roundPhase !== lastRoundPhase) {
    // freezetime = new round starting, over = round just ended, warmup = warmup started
    if (roundPhase === 'freezetime' || roundPhase === 'over' || roundPhase === 'warmup') {
      console.log(`round ended (phase: ${roundPhase}), moving dead players back`);
      moveAllBack();
    }
    lastRoundPhase = roundPhase;
  }

  // check for death
  if (!gs.player) return;
  const health = gs.player.state?.health ?? 100;
  const prev = playerStates.get(steamId) || { health: 100 };

  if (prev.health > 0 && health === 0 && roundPhase === 'live') {
    console.log(`${steamId} died`);
    moveToDeadChannel(discordId);
  }

  playerStates.set(steamId, { health });
});

async function moveToDeadChannel(userId) {
  if (deadPlayers.has(userId)) return; // already dead

  for (const guild of client.guilds.cache.values()) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member?.voice.channel) continue;

    const deadChannelId = config.deadChannels[guild.id];
    if (!deadChannelId) {
      console.log(`no dead channel set for ${guild.name}`);
      continue;
    }

    const deadChannel = guild.channels.cache.get(deadChannelId);
    if (!deadChannel) {
      console.log(`dead channel not found in ${guild.name}`);
      continue;
    }

    // already in dead channel
    if (member.voice.channel.id === deadChannelId) continue;

    const originalChannelId = member.voice.channel.id;
    console.log(`moving ${member.user.tag} to ${deadChannel.name}`);

    try {
      await member.voice.setChannel(deadChannel, 'died in cs2');
      deadPlayers.set(userId, { visordId: userId, originalChannelId, guildId: guild.id });
      break;
    } catch (e) {
      console.log(`couldnt move ${member.user.tag}:`, e.message);
    }
  }
}

async function moveAllBack() {
  for (const [userId, data] of deadPlayers) {
    try {
      const guild = client.guilds.cache.get(data.guildId);
      if (!guild) continue;

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member?.voice.channel) continue;

      const deadChannelId = config.deadChannels[guild.id];
      // only move back if still in dead channel
      if (member.voice.channel.id !== deadChannelId) continue;

      const originalChannel = guild.channels.cache.get(data.originalChannelId);
      if (!originalChannel) continue;

      await member.voice.setChannel(originalChannel, 'round ended');
      console.log(`moved ${member.user.tag} back to ${originalChannel.name}`);
    } catch (e) {
      console.log(`couldnt move user back:`, e.message);
    }
  }
  deadPlayers.clear();
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
