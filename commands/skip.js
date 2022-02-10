const { SlashCommandBuilder } = require('@discordjs/builders');
const { displayTime } = require('../utils/displayTime');
const commands = require('./commands.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription(commands.skip),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction
                .followUp('ur trolling join a channel first')
                .catch(console.error);
        }

        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction
                .followUp('nothins playin right now dawg')
                .catch(console.error);
        }

        try {
            serverQueue.loop = false;
            serverQueue.audioPlayer.stop();
        } catch (err) {
            console.error(err);
            return await interaction
                .followUp(
                    'An error was encountered when trying to skip, check console.'
                )
                .catch(console.error);
        }

        return await interaction
            .followUp(
                `Skipped **${serverQueue.songs[0].title}** \`${displayTime(
                    serverQueue.songs[0].length
                )}\``
            )
            .catch(console.error);
    }
};
