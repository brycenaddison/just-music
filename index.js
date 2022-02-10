const fs = require('fs');
require('dotenv').config();
const { Client, Collection, Intents } = require('discord.js');
const { version } = require('./package.json');
const { google } = require('googleapis');
const { reset } = require('./commands/stop');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        //    Discord.Intents.FLAGS.GUILD_PRESENCES,
        //    Discord.Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_WEBHOOKS,
        Intents.FLAGS.GUILD_INTEGRATIONS
    ]
});

client.queue = new Map();

console.log('Initializing API...');
client.youtube = google.youtube({
    version: 'v3',
    auth: process.env.API_KEY
});

console.log('Loading commands...');
client.commands = new Collection();
const commandFiles = fs
    .readdirSync('./commands')
    .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
    console.log(`Loaded ${command.data.name}`);
}
console.log('All commands are loaded.');

client.once('ready', () => {
    client.user.setActivity(`music | /help | ${version}`, { type: 'PLAYING' });
    console.log(`just music version ${version} loaded`);
});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await interaction.deferReply();
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction
            .followUp({
                content: 'There was an error while executing this command.',
                ephemeral: true
            })
            .catch(console.error);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!oldState.channel) return;

    const guildId = oldState.guild.id;
    const serverQueue = client.queue.get(guildId);

    if (!serverQueue) return;

    if (newState.channel) return;

    if (oldState.channel.members.size == 1) return reset(guildId, client.queue);
});

client.on('shardError', (error) => {
    console.error('A websocket connection encountered an error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

client.on('error', console.warn);

process.on('SIGINT', () => {
    console.log('Closing just music...');
    client.destroy();
    process.exit();
});

console.log('Logging in...');
client.login(process.env.TOKEN);
console.log('Logged in.');
