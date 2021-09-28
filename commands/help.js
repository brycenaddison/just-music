const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');
const { prefix, color } = require('../config.json');
const { version } = require('../package.json');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription(commands.help),
	async execute(interaction) {
		const menu = new MessageEmbed()
			.setColor(color)
			.setTitle('Commands List')
			.setDescription('just music by Brycen Addison | version ' + version);

		for (const command in commands) {
			menu.addField(`${prefix}${command}`, commands[command]);
		}

		return await interaction.reply({ embeds: [menu] })
			.catch(console.error);
	},
};