const { SlashCommandBuilder } = require('@discordjs/builders');
const { shuffleArray } = require('../utils/shuffleArray');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription(commands.shuffle),
    async execute(interaction) {
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction
                .followUp('nothins playin right now dawg')
                .catch(console.error);
        }
        if (serverQueue.songs.length < 2) {
            return await interaction
                .followUp(
                    'no songs in the queue to clear, idk what else to say'
                )
                .catch(console.error);
        }

        const tempArray = Array.from(serverQueue.songs);
        const currentSong = tempArray.shift();
        shuffleArray(tempArray);
        tempArray.unshift(currentSong);
        serverQueue.songs = tempArray;

        return await interaction
            .followUp(`Shuffled \`${tempArray.length - 1}\` songs.`)
            .catch(console.error);
    }
};
