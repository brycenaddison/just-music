const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription(commands.clear),
    async execute(interaction) {
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction.followUp('nothins playin right now dawg');
        }
        if (serverQueue.songs.length < 2) {
            return await interaction.followUp(
                'no songs in the queue to clear, idk what else to say'
            );
        }
        const count = serverQueue.songs.length - 1;
        serverQueue.songs = [serverQueue.songs[0]];
        return await interaction
            .followUp(`Removed \`${count}\` songs from the queue.`)
            .catch(console.error);
    }
};
