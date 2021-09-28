import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { stop } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription(stop);

export function reset(guildId, queue) {
    if (queue.get(guildId)) {
        queue.get(guildId).audioPlayer.stop();
        console.log('Audio player stopped');
        getVoiceConnection(guildId).destroy();
        console.log('Voice connection destroyed');
        queue.delete(guildId);
        console.log('Server queue deleted');
    }
}
export async function execute(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.reply('nothins playin right now dawg');
    }

    this.reset(interaction.guild.id, interaction.client.queue);

    return await interaction.reply('k bye').catch(console.error);
}
