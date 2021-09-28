const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');
const { displayTime } = require('../utils/displayTime');
const { search } = require('../utils/search');
const ytdl = require('ytdl-core');
const { createAudioPlayer, createAudioResource, joinVoiceChannel, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice');

async function execute(interaction, songInfo, playlistSong = false) {

	const voiceChannel = interaction.member.voice.channel;

	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		length: parseInt(songInfo.videoDetails.lengthSeconds),
		thumbnail: songInfo.videoDetails.thumbnails[0].url,
		interaction: interaction,
	};

	const serverQueue = interaction.client.queue.get(interaction.guild.id);

	if (serverQueue) {
		serverQueue.songs.push(song);
		if (!playlistSong) {
			return await interaction.editReply(`**${song.title}** \`${displayTime(song.length)}\` was added to the queue at position \`${serverQueue.songs.length - 1}\`.`)
				.catch(console.error);
		}
	}
	else {

		const queueContract = {
			textChannel: interaction.channel,
			voiceChannel: voiceChannel,
			audioPlayer: createAudioPlayer(),
			songs: [],
			loop: false,
			loop_count: 0,
			playing: true,
		};
		interaction.client.queue.set(interaction.guild.id, queueContract);
		queueContract.songs.push(song);

		try {
			const connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: voiceChannel.guild.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			});
			connection.subscribe(queueContract.audioPlayer);

			queueContract.audioPlayer.on('stateChange', (oldState, newState) => {
				if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
					if (queueContract.loop) {
						queueContract.loop_count++;
					}
					else {
						queueContract.songs.shift();
					}
					play(interaction.guild, queueContract.songs[0], interaction.client.queue);
				}
			}).on('error', error => {
				console.error(error);
				connection.destroy();
				interaction.client.queue.delete(interaction.guild.id);
				return;
			});

			play(interaction.guild, queueContract.songs[0], interaction.client.queue);

		}
		catch (e) {
			console.error(e);
			getVoiceConnection(interaction.guild.id).destroy();
			interaction.client.queue.delete(interaction.guild.id);
			interaction.editReply('Unknown error encountered, check logs.');
			return false;
		}
	}
}

function play(guild, song, queue) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		getVoiceConnection(guild.id).destroy();
		queue.delete(guild.id);
		return;
	}

	try {
		const resource = createAudioResource(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 512 * 1024 * 1024 }));

		serverQueue.audioPlayer.play(resource);

		song.interaction.editReply(`Now playing: **${song.title}** \`${displayTime(song.length)}\``);
	}
	catch (e) {
		console.error(e);
	}

}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription(commands.play)
		.addStringOption(option =>
			option.setName('query')
				.setDescription('Enter a YouTube search or link')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply();

		const voiceChannel = interaction.member.voice.channel;

		if (!voiceChannel) {
			return await interaction.editReply('ur trolling join a channel first')
				.catch(console.error);
		}

		const permissions = voiceChannel.permissionsFor(interaction.client.user);

		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			return await interaction.editReply('but like i need permissions bro')
				.catch(console.error);
		}

		const songInfo = await search(interaction.options.getString('query'), interaction.client.youtube);

		if (songInfo instanceof Error) {
			return await interaction.editReply('Unknown error encountered, check logs.')
				.catch(console.error);
		}
		if (songInfo === null) {
			return await interaction.editReply('No results found. Try using different keywords.')
				.catch(console.error);
		}
		if (songInfo === undefined) {
			return await interaction.editReply('how the fuck do I use async')
				.catch(console.error);
		}
		await execute(interaction, songInfo);
	},
};