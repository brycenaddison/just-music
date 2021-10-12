const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription(commands.pause),
    async execute(interaction) {
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction
                .followUp('nothins playin right now dawg')
                .catch(console.error);
        }

        if (serverQueue.playing) {
            serverQueue.audioPlayer.pause();
            serverQueue.playing = false;
            return await interaction
                .followUp(
                    'Playback has been paused. Use `/pause` again to resume playback.'
                )
                .catch(console.error);
        } else {
            serverQueue.audioPlayer.unpause();
            serverQueue.playing = true;
            return await interaction
                .followUp('Playback has been resumed.')
                .catch(console.error);
        }
    }
};
