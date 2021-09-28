const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription(commands.stop),
	async execute(interaction) {
		const serverQueue = interaction.client.queue.get(interaction.guild.id);

		if (!serverQueue) {
			return await interaction.reply('nothins playin right now dawg');
		}

		getVoiceConnection(interaction.guild.id).destroy();
		interaction.client.queue.delete(interaction.guild.id);

		return await interaction.reply('k bye')
			.catch(console.error);
	},
};