const { SlashCommandBuilder } = require('@discordjs/builders');
const { displayTime } = require('../utils/displayTime');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription(commands.remove)
        .addIntegerOption((option) =>
            option
                .setName('number')
                .setDescription('Enter the track number to remove from the queue')
                .setRequired(true)
        ),
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
                    'no songs in the queue to remove, idk what else to say'
                )
                .catch(console.error);
        }

        const toRemove = interaction.options.getInteger('number');

        if (toRemove <= 0 || toRemove >= serverQueue.songs.length) {
            return await interaction
                .followUp(
                    `There is no song with number \`${toRemove}\`! Pick a track number as shown on \`/queue\`.`
                )
                .catch(console.error);
        }
        const removedSong = serverQueue.songs.splice(toRemove, 1)[0];
        return await interaction
            .followUp(
                `Succesfully removed **${removedSong.title}** \`${displayTime(removedSong.length)}\` from queue.`
            )
            .catch(console.error);
    }
};
