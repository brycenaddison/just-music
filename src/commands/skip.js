import { SlashCommandBuilder } from '@discordjs/builders';
import { skip } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription(skip);

export async function execute(interaction) {
    await interaction.reply('Not yet implemented.');
}
