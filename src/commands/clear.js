import { SlashCommandBuilder } from '@discordjs/builders';
import { clear } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription(clear);

export async function execute(interaction) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction.reply('nothins playin right now dawg');
    }
    if (serverQueue.songs.length < 2) {
        return await interaction.reply(
            'no songs in the queue to clear, idk what else to say'
        );
    }
    const count = serverQueue.songs.length - 1;
    serverQueue.songs = [serverQueue.songs[0]];
    return await interaction
        .reply(`Removed \`${count}\` songs from the queue.`)
        .catch(console.error);
}
