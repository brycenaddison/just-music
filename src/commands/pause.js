import { SlashCommandBuilder } from '@discordjs/builders';
import { pause } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription(pause);

export async function execute(interaction) {
    await interaction.reply('Not yet implemented.');
}
