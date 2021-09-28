const fs = require('fs');
require('dotenv').config();
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { prefix, color } = require('./config.json');
const { version } = require('./package.json');
const ytdl = require('ytdl-core');
const { google } = require('googleapis');

const client = new Client({ intents: [
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	//    Discord.Intents.FLAGS.GUILD_PRESENCES,
	//    Discord.Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_VOICE_STATES,
	Intents.FLAGS.GUILD_WEBHOOKS,
	Intents.FLAGS.GUILD_INTEGRATIONS,
] });

client.queue = new Map();

client.youtube = google.youtube({
	version: 'v3',
	auth: process.env.API_KEY,
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	client.user.setActivity(`music | !help | ${version}`,
		{ type: 'PLAYING' },
	);
	console.log(`just music version ${version} loaded`);
});

client.once('reconnecting', () => {
	console.log('Reconnecting!');
});

client.once('disconnect', () => {
	console.log('Disconnect!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		// await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true })
		//	.catch(console.error);
	}
});

/*
async function search(message, serverQueue) {

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) {return message.channel.send('ur trolling join a channel first');}
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('but like i need permissions bro');
	}

	const args = message.content.split(' ');
	args.shift();

	const LINK_DETECTION_REGEX = /(([a-z]+:\/\/)?(([a-z0-9-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-.~]+)*(\/([a-z0-9_\-.]*)(\?[a-z0-9+_\-.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
	const matches = LINK_DETECTION_REGEX.exec(args[0]);

	if (matches != null) {

		try {

			const songInfo = await ytdl.getInfo(matches[0]);
			execute(message, songInfo, serverQueue);
			const urlParams = new URLSearchParams(matches[10]);

			if (urlParams.has('list')) {

				const playlistId = urlParams.get('list');
				const origVideoId = urlParams.get('v');
				let count = 0;

				youtube.playlistItems.list({
					'part': [
						'snippet',
					],
					'maxResults': 50,
					'playlistId': playlistId,
				}).then(
					async function(response) {
						response.data.items.forEach(async function(item, index) {
							const itemId = item.snippet.resourceId['videoId'];
							if (itemId != origVideoId) {
								count++;
								const playlistSongInfo = await ytdl.getInfo('https://youtube.com/watch?v=' + itemId);

								await execute(message, playlistSongInfo, queue.get(message.guild.id), true);
							}
						});
						return count;
					},
					function(err) {
						console.error('Execute error', err);
					},
				).then(async function(finalCount) {
					return await message.channel.send(`Adding \`${finalCount + 1}\` songs from the playlist to the queue.`);
				});

			}

		}
		catch (err) {
			console.error(err);
			return message.channel.send('Unknown error encountered. Check logs.');
		}

	}
	else {

		const query = args.join(' ');

		youtube.search.list(
			{
				part:'snippet',
				q: query,
				maxResults: 1,
			},
			async function(err, data) {
				if (err) {
					console.error(err);
					return message.channel.send('Unknown error encountered, check logs.');
				}
				if (data) {
					if (data.data.items.length === 1) {
						try {
							const songInfo = await ytdl.getInfo('https://youtube.com/watch?v=' + data.data.items[0].id.videoId);
							execute(message, songInfo, serverQueue);
						}
						catch (err) {
							console.error(err);
						}
					}
					else {
						return message.channel.send('No results found. Try using different keywords.');
					}
				}
			},
		);
	}
}

async function execute(message, songInfo, serverQueue, playlistSong = false) {

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) {
		return message.channel.send('ur trolling join a channel first');
	}
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('give me permissions fucktard');
	}

	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
		length: parseInt(songInfo.videoDetails.lengthSeconds),
		thumbnail: songInfo.videoDetails.thumbnails[0].url,
	};

	if (serverQueue) {
		serverQueue.songs.push(song);
		if (!playlistSong) return message.channel.send(`**${song.title}** \`${displayTime(song.length)}\` was added to the queue at position \`${serverQueue.songs.length - 1}\`.`);
	}
	else {
		const queueContract = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			loop: false,
			loop_count: 0,
			playing: true,
			dispatcher: null,
		};
		queue.set(message.guild.id, queueContract);
		queueContract.songs.push(song);

		try {
			const connection = await message.member.voice.channel.join();
			queueContract.connection = connection;
			play(message.guild, queueContract.songs[0]);
		}
		catch (e) {
			console.error(e);
			queue.delete(message.guild.id);
			message.channel.send('Unknown error encountered, check logs.');
			return false;
		}
	}
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);
	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	serverQueue.dispatcher = serverQueue.connection
		.play(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 512 * 1024 * 1024 }))
		.on('finish', () => {
			if (serverQueue.loop) {
				serverQueue.loop_count++;
			}
			else {
				serverQueue.songs.shift();
			}
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	serverQueue.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	serverQueue.textChannel.send(`Now playing: **${song.title}** \`${displayTime(song.length)}\``);
}

function skip(message, serverQueue) {
	if (!message.member.voice.channel) {return message.channel.send('you kinda have to be in a channel bud, no other way to put it');}
	if (!serverQueue) {return message.channel.send('now tell me how im supposed to skip a song if nothing is playing');}
	try {
		serverQueue.connection.dispatcher.end();
	}
	catch (err) {
		console.error(err);
	}
	return message.channel.send(`Skipped **${serverQueue.songs[0].title}** \`${displayTime(serverQueue.songs[0].length)}\``);
}

function stop(message, serverQueue) {
	if (!message.member.voice.channel) {return message.channel.send('you kinda have to be in a channel bud, no other way to put it');}
	if (!serverQueue) {return message.channel.send('now tell me how im supposed to stop playing if nothing is playing');}
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
	return message.channel.send('k bye');
}

async function list(message, serverQueue, page = 1, existingMessage = null) {
	if (existingMessage) {
		const reactions = existingMessage.reactions.cache;
		try {
			for (const reaction of reactions.values()) {
				await reaction.users.remove(message.author.id);
			}
		}
		catch (error) {
			console.error('Failed to remove reactions.');
		}
	}
	const results = generateContent(message, serverQueue, page);
	page = results[2];
	const menu = new MessageEmbed()
		.setColor(color)
		.setTitle('Current Queue')
		.setDescription(results[0])
		.setThumbnail(serverQueue.songs[0].thumbnail);
	if (results[1] > 1) menu.setFooter(`Page ${page}/${results[1]} | Use arrows to change page`);
	((existingMessage) ? existingMessage.edit(menu) : message.channel.send(menu)).then(async (newmsg) => {
		if (results[1] <= 1) return;

		Promise.all([
			newmsg.react('⬅️'),
			newmsg.react('➡️'),
		])
			.catch(() => console.error('One of the emojis failed to react.'));

		newmsg.createReactionCollector((reaction, user) => {
			return (user.id == message.author.id) && (reaction.emoji.name === '⬅️' || reaction.emoji.name === '➡️');
		},
		).once('collect', async reaction => {
			const chosen = reaction.emoji.name;
			if (chosen === '⬅️') {
				await list(message, serverQueue, page = page - 1, existingMessage = newmsg);
			}
			else if (chosen === '➡️') {
				await list(message, serverQueue, page = page + 1, existingMessage = newmsg);
			}
		});
	},
	);
}

function generateContent(message, serverQueue, page) {
	if (page < 1) page++;

	let content = '';
	const pages = [];
	const queueLength = Object.keys(serverQueue.songs).length;
	let totalTime = 0;
	let inQueue = 0;

	if (!serverQueue.loop) {
		content += `Currently Playing: [**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url}) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
		if (queueLength < 2) {
			content = `\nNothing else is queued. Use ${prefix}play to add a song!\n`;
		}
		else {
			content += '\n**Up next:**\n';
		}
		for (let i = 1; i < Object.keys(serverQueue.songs).length; i++) {
			if (pages[Math.floor(i / 10)] == null) pages[Math.floor(i / 10)] = `${i}. [${serverQueue.songs[i].title}](${serverQueue.songs[i].url}) \`${displayTime(serverQueue.songs[i].length)}\`\n`;
			else pages[Math.floor(i / 10)] += `${i}. [${serverQueue.songs[i].title}](${serverQueue.songs[i].url}) \`${displayTime(serverQueue.songs[i].length)}\`\n`;
			totalTime += serverQueue.songs[i].length;
			inQueue++;
		}
		while (page > pages.length) page--;
		if (pages[page - 1]) content += pages[page - 1];
		let s = '';
		if (queueLength > 2) s = 's';
		if (queueLength > 1) {
			content += `\n${inQueue} song${s} in queue | \`${displayTime(totalTime)}\` total runtime`;
		}

		if (content.length > 2048) {
			message.channel.send('message too long blah blah over 2048 characters blah blah yeah ill add pages maybe later but for now heres just the first 2048 characters');
			content = content.substring(0, 2048);
		}
	}
	else {
		content += `Currently Looping: [**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url}) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
		content += `\nLooped **${serverQueue.loop_count}** ${(serverQueue.loop_count === 1) ? 'time' : 'times'} for a total of \`${displayTime(serverQueue.loop_count * serverQueue.songs[0].length)}\`\n`;
		content += `\nType ${prefix}loop to disable looping.`;
	}
	if (!serverQueue.playing) {
		content += `Playback is paused. Use \`${prefix}pause\` again to resume playback.`;
	}
	return [content, pages.length, page];
}

function displayTime(total_seconds) {
	const hours = Math.floor(total_seconds / 3600);
	let minutes = Math.floor((total_seconds % 3600) / 60);
	let seconds = Math.floor(total_seconds % 60);
	minutes = ((Math.floor(minutes / 10) === 0) ? '0' : '') + minutes;
	seconds = ((Math.floor(seconds / 10) === 0) ? '0' : '') + seconds;
	return (hours === 0) ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
}

function toggleLoop(message, serverQueue) {
	if (!serverQueue) {
		return message.channel.send('nothins playin right now dawg');
	}

	if (serverQueue.loop) {
		serverQueue.loop = false;
		serverQueue.loop_count = 0;
		return message.channel.send('Looping disabled.');
	}

	if (!serverQueue.loop) {
		serverQueue.loop = true;
		return message.channel.send('Looping enabled.');
	}
}

function remove(message, serverQueue) {
	const args = message.content.split(' ');
	args.shift();
	const toRemove = parseInt(args);
	if (Number.isNaN(toRemove)) {
		return message.channel.send(`That is not a valid number. Pick a track number as shown on \`${prefix}queue\`.`);
	}
	if (toRemove <= 0 || toRemove >= serverQueue.songs.length) {
		return message.channel.send(`There is no song with number \`${toRemove}\`! Pick a track number as shown on \`${prefix}queue\`.`);
	}
	const removedSong = serverQueue.songs.splice(toRemove, 1)[0];
	return message.channel.send(`Succesfully removed **${removedSong.title}** \`${displayTime(removedSong.length)}\` from queue.`);
}

function pause(message, serverQueue) {
	if (!serverQueue) {
		return message.channel.send('nothins playin right now dawg');
	}
	if (serverQueue.playing) {
		serverQueue.dispatcher.pause();
		serverQueue.playing = false;
		return message.channel.send(`Playback has been paused. Use \`${prefix}pause\` again to resume playback.`);
	}
	else {
		serverQueue.dispatcher.resume();
		serverQueue.playing = true;
		message.channel.send('Playback has resumed.');
	}
}

function shuffle(message, serverQueue) {
	if (!serverQueue) {
		return message.channel.send('nothins playin right now dawg');
	}
	if (serverQueue.songs.length < 2) {
		return message.channel.send('no songs in the queue to shuffle, idk what else to say');
	}
	const tempArray = Array.from(serverQueue.songs);
	const currentSong = tempArray.shift();
	for (let i = tempArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * i);
		const temp = tempArray[i];
		tempArray[i] = tempArray[j];
		tempArray[j] = temp;
	}
	tempArray.unshift(currentSong);
	serverQueue.songs = tempArray;
	return message.channel.send(`Shuffled \`${tempArray.length - 1}\` songs.`);
}

*/
client.login(process.env.TOKEN);
