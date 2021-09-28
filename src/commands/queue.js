import { SlashCommandBuilder } from '@discordjs/builders';
import { queue } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription(queue);

export async function execute(interaction) {
    await interaction.reply('Not yet implemented.');
}
