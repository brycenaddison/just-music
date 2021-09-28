import { SlashCommandBuilder } from '@discordjs/builders';
import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus
} from '@discordjs/voice';
import ytdl from 'ytdl-core';
import { play as _play } from '../constants.js';
import { displayTime } from '../utils/displayTime';
import { search } from '../utils/search';
import { reset } from './stop';

async function execute(interaction, songInfo, playlistSong = false) {
    const voiceChannel = interaction.member.voice.channel;
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        length: parseInt(songInfo.videoDetails.lengthSeconds),
        thumbnail: songInfo.videoDetails.thumbnails[0].url,
        interaction: interaction
    };
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (serverQueue) {
        serverQueue.songs.push(song);
        if (!playlistSong) {
            return await interaction
                .editReply(
                    `**${song.title}** \`${displayTime(
                        song.length
                    )}\` was added to the queue at position \`${
                        serverQueue.songs.length - 1
                    }\`.`
                )
                .catch(console.error);
        }
    } else {
        const queueContract = {
            textChannel: interaction.channel,
            voiceChannel: voiceChannel,
            audioPlayer: createAudioPlayer(),
            songs: [],
            loop: false,
            loop_count: 0,
            playing: true
        };
        interaction.client.queue.set(interaction.guild.id, queueContract);
        queueContract.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            }).subscribe(queueContract.audioPlayer);

            connection.on('error', console.warn);

            try {
                await entersState(
                    connection,
                    VoiceConnectionStatus.Ready,
                    20e3
                );
            } catch (error) {
                console.warn(error);
                await interaction.followUp(
                    'Failed to join voice channel within 20 seconds, please try again later!'
                );
                return;
            }

            play(
                interaction.guild.id,
                queueContract.songs[0],
                interaction.client.queue
            );
        } catch (err) {
            console.error(err);
            reset(interaction.guild.id, interaction.client.queue);
            interaction.editReply('Unknown error encountered, check logs.');
            return false;
        }

        queueContract.audioPlayer
            .on('stateChange', (oldState, newState) => {
                if (
                    newState.status === AudioPlayerStatus.Idle &&
                    oldState.status !== AudioPlayerStatus.Idle
                ) {
                    if (queueContract.loop) {
                        queueContract.loop_count++;
                    } else {
                        queueContract.songs.shift();
                    }
                    play(
                        interaction.guild.id,
                        queueContract.songs[0],
                        interaction.client.queue
                    );
                }
            })
            .on('error', (error) => {
                console.error(error);
                reset(interaction.guild.id, interaction.client.queue);
            });
    }
}

function play(guildId, song, queue) {
    const serverQueue = queue.get(guildId);

    if (!song) {
        return reset(guildId, queue);
    }

    try {
        const resource = createAudioResource(
            ytdl(song.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 512 * 1024 * 1024
            })
        );

        serverQueue.audioPlayer.play(resource);
        song.interaction.editReply(
            `Now playing: **${song.title}** \`${displayTime(song.length)}\``
        );
    } catch (err) {
        console.error(err);
    }
}

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription(_play)
    .addStringOption((option) =>
        option
            .setName('query')
            .setDescription('Enter a YouTube search or link')
            .setRequired(true)
    );

export async function execute(interaction) {
    try {
        await interaction.deferReply();
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply('ur trolling join a channel first');
        }

        const permissions = voiceChannel.permissionsFor(
            interaction.client.user
        );

        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.editReply('but like i need permissions bro');
        }

        const songInfo = await search(
            interaction.options.getString('query'),
            interaction.client.youtube
        );

        await execute(interaction, songInfo);
    } catch (err) {
        console.error(err);
        await interaction.editReply('Unknown error encountered, check logs.');
    }
}
