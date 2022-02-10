const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription(commands.stop),
    reset(guildId, queue) {
        if (queue.get(guildId)) {
            queue.get(guildId).audioPlayer.stop();
            getVoiceConnection(guildId).destroy();
            queue.delete(guildId);
        }
    },
    async execute(interaction) {
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction.followUp('nothins playin right now dawg');
        }

        this.reset(interaction.guild.id, interaction.client.queue);

        return await interaction.followUp('k bye').catch(console.error);
    }
};
