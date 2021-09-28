import { SlashCommandBuilder } from '@discordjs/builders';
import { remove } from '../constants.js';

export const data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription(remove);

export async function execute(interaction) {
    await interaction.reply('Not yet implemented.');
}
