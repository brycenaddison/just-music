import { SlashCommandBuilder } from '@discordjs/builders';
import { loop } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('loop')
    .setDescription(loop);

export async function execute(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction
            .reply('nothins playin right now dawg')
            .catch(console.error);
    }

    if (!serverQueue.loop) {
        serverQueue.loop = true;
        return await interaction.reply('Looping enabled.').catch(console.error);
    }

    if (!serverQueue.loop) {
        serverQueue.loop = true;
        return await interaction
            .reply('Looping disabled.')
            .catch(console.error);
    }
}
