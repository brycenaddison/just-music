const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription(commands.loop),
    async execute(interaction) {
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction
                .followUp('nothins playin right now dawg')
                .catch(console.error);
        }

        if (!serverQueue.loop) {
            serverQueue.loop = true;
            return await interaction
                .followUp('Looping enabled.')
                .catch(console.error);
        } else {
            serverQueue.loop = false;
            return await interaction
                .followUp('Looping disabled.')
                .catch(console.error);
        }
    }
};
