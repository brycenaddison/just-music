import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { color, commands, help, prefix, version } from '../constants.json';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription(help);

export async function execute(interaction) {
    const menu = new MessageEmbed()
        .setColor(color)
        .setTitle('Commands List')
        .setDescription('just music by Brycen Addison | version ' + version);

    for (const command in commands) {
        menu.addField(`${prefix}${command}`, commands[command]);
    }

    return await interaction.reply({ embeds: [menu] }).catch(console.error);
}
