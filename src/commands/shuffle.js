import { SlashCommandBuilder } from '@discordjs/builders';
import { shuffle } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription(shuffle);

export async function execute(interaction) {
    await interaction.reply('Not yet implemented.');
}
