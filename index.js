require('dotenv').config();
const Discord = require('discord.js');
const {prefix, color,} = require('./config.json');
const commands = require('./commands.json');
const ytdl = require('ytdl-core');
const {google} = require('googleapis');

const client = new Discord.Client();
const queue = new Map();
const youtube = google.youtube({
   version: 'v3',
   auth: process.env.API_KEY
});

client.once("ready", () => {
    client.user.setActivity("music | !help",
        {type: 'PLAYING'}
    );
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on('message', async message => {
  if (!message.content.startsWith(prefix)) return;
  if (message.author.bot) return;

  const serverQueue = queue.get(message.guild.id);
  if (message.content.startsWith(`${prefix}play`)) {
  	search(message, serverQueue);
    return;
  } else if (message.content === `${prefix}stop`) {
    stop(message, serverQueue);
    return;
  } else if (message.content === `${prefix}skip`) {
    skip(message, serverQueue);
    return;
  } else if (message.content === `${prefix}help`) {
    help(message);
    return;
  } else if (message.content === `${prefix}queue`) {
    list(message, serverQueue);
    return;
  } else if (message.content === `${prefix}loop`) {
    toggleLoop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}remove`)) {
    remove(message, serverQueue);
    return;
  } else if (message.content === `${prefix}pause`) {
    pause(message, serverQueue);
    return;
  }
})

async function search(message, serverQueue) {
    
    const args = message.content.split(' ');
    args.shift();

    try {

        const songInfo = await ytdl.getInfo(args[0]);
        execute(message, songInfo, serverQueue);

    } catch {

        const query = args.join(' ');
        
        youtube.search.list(
            {
                part:'snippet', 
                q: query, 
                maxResults: 1
            }, 
            async function (err, data) {
                if (err) {
                    console.error(err);
                    return message.channel.send("Unknown error encountered, check logs.");
                }
                if (data) {
                    console.log(data);
                    if (data.data.items.length == 1) {
                        const songInfo = await ytdl.getInfo('https://youtube.com/watch?v='+data.data.items[0].id.videoId);
                        execute(message, songInfo, serverQueue);
                    }
                    else {
                        return message.channel.send("No results found. Try using different keywords.");
                    }
                }
            }
        ); 
    }
}

async function execute(message, songInfo, serverQueue) {

	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel)
		return message.channel.send("ur trolling join a channel first");
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send("give me permissions fucktard");
	}
    
	const song = {
		title: songInfo.videoDetails.title,
		url: songInfo.videoDetails.video_url,
        length: parseInt(songInfo.videoDetails.lengthSeconds),
        thumbnail: songInfo.videoDetails.thumbnail.thumbnails[0].url
	}

	if (serverQueue) {
		serverQueue.songs.push(song);
		return message.channel.send(`**${song.title}** \`${displayTime(song.length)}\` was added to the queue at position \`${serverQueue.songs.length - 1}\`.`);
	} else {
		const queueContract = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			loop: false,
            loop_count: 0,
            playing: true,
            dispatcher: null
		};
		queue.set(message.guild.id, queueContract)
		queueContract.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueContract.connection = connection;
			play(message.guild, queueContract.songs[0])
		} catch (e) {
			console.log(e);
			queue.delete(message.guild.id);
			return message.channel.send('Unknown error encountered, check logs.');
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
        .play(ytdl(song.url))
        .on("finish", () => {
            if (serverQueue.loop) {
                serverQueue.loop_count++;
            } else {
                serverQueue.songs.shift();
            }
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    serverQueue.dispatcher.setVolumeLogarithmic(serverQueue.volume/5);
    serverQueue.textChannel.send(`Now playing: **${song.title}** \`${displayTime(song.length)}\``);
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("you kinda have to be in a channel bud, no other way to put it");
    if (!serverQueue)
        return message.channel.send("now tell me how the fuck im supposed to skip a song if nothing is playing");
    serverQueue.connection.dispatcher.end();
    return message.channel.send(`Skipped **${serverQueue.songs[0].title}** \`${displayTime(serverQueue.songs[0].length)}\``);
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("you kinda have to be in a channel bud, no other way to put it");
    if (!serverQueue)
        return message.channel.send("now tell me how the fuck im supposed to stop playing if nothing is playing");
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    return message.channel.send("k bye");
}

function help(message) {
    const menu = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle('Commands List')
    .setDescription('just music by Brycen Addison');

    for (const command in commands) {
        menu.addField(`${prefix}${command}`, commands[command]);
    }

    return message.channel.send(menu);
}

function list(message, serverQueue) {
    if (!serverQueue) {
        return message.channel.send('nothins playin right now dawg');
    }
    
    let content = ''
    const queueLength = Object.keys(serverQueue.songs).length;
    let totalTime = 0;
    let inQueue = 0;
    
    if (!serverQueue.loop) {
        content += `Currently Playing: [**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url}) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
        if (queueLength < 2) {
            content += `\nNothing else is queued. Use ${prefix}play to add a song!\n`;
        } else {
            content += `\n**Up next:**\n`;
        }
        for (i = 1; i < Object.keys(serverQueue.songs).length; i++) {
            content += `${i}. [${serverQueue.songs[i].title}](${serverQueue.songs[i].url}) \`${displayTime(serverQueue.songs[i].length)}\`\n`;
            totalTime += serverQueue.songs[i].length;
            inQueue++;
        }

        let s = "";
        if (queueLength > 2) s = "s";
        if (queueLength > 1) {
           content += `\n${inQueue} song${s} in queue | \`${displayTime(totalTime)}\` total runtime`;
        }

        if (content.length > 2048) {
            message.channel.send("message too long blah blah over 2048 characters blah blah yeah ill add pages and shit maybe later but for now heres just the first 2048 characters");
            content = content.substring(0,2048);
        }
    } else {
        content += `Currently Looping: [**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url}) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
        content += `\nLooped **${serverQueue.loop_count}** ${(serverQueue.loop_count === 1) ? 'time' : 'times'} for a total of \`${displayTime(serverQueue.loop_count*serverQueue.songs[0].length)}\`\n`;
        content += `\nType ${prefix}loop to disable looping.`;
    }
    if (!serverQueue.playing) {
        content += `Playback is paused. Use \`${prefix}pause\` again to resume playback.`;
    }
    const menu = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle('Current Queue')
    .setDescription(content)
    .setThumbnail(serverQueue.songs[0].thumbnail);
    return message.channel.send(menu);
}

function displayTime(total_seconds) {
    let hours = Math.floor(total_seconds/3600);
    let minutes = Math.floor((total_seconds%3600)/60);
    let seconds = Math.floor(total_seconds%60);
    minutes = ((Math.floor(minutes/10) === 0) ? '0' : '') + minutes;
    seconds = ((Math.floor(seconds/10) === 0) ? '0' : '') + seconds;
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
        return message.channel.send(`There is no song with number \`${toRemove}\`! Pick a track number as shown on \`${prefix}queue\`.`)
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
        return message.channel.send(`Playback has resumed.`);
    }
}

client.login(process.env.TOKEN);