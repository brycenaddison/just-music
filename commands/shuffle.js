const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription(commands.shuffle),
    async execute(interaction) {
        await interaction.reply('Not yet implemented.');
    }
};
