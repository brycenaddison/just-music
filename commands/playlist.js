const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');
const { queueSong } = require('./play');
const { send } = require('../utils/send');
const ytdl = require('ytdl-core');
const { GaxiosError } = require('gaxios');

async function playPlaylist(interaction) {
    return new Promise((resolve) => {
        const regex =
            /(([a-z]+:\/\/)?(([a-z0-9-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-.~]+)*(\/([a-z0-9_\-.]*)(\?[a-z0-9+_\-.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
        const matches = regex.exec(interaction.options.getString('link'));

        if (matches == null) {
            resolve('Please use a valid link.');
        }

        const urlParams = new URLSearchParams(matches[10]);

        if (!urlParams.has('list')) {
            resolve('Make sure the link includes the playlist.');
        }

        const playlistId = urlParams.get('list');

        interaction.client.youtube.playlistItems
            .list({
                part: ['snippet'],
                maxResults: 50,
                playlistId: playlistId
            })
            .then(async function (response) {
                let count = 0;
                const promises = [];
                await response.data.items.forEach(async function (item) {
                    promises.push(
                        ytdl
                            .getInfo(
                                'https://youtube.com/watch?v=' +
                                    item.snippet.resourceId['videoId']
                            )
                            .catch(console.error)
                    );
                });
                await Promise.all(promises).then((results) => {
                    results.forEach(function (playlistSongInfo) {
                        queueSong(interaction, playlistSongInfo, true)
                            .then(count++)
                            .catch((error) => {
                                console.error(error);
                                count--;
                            });
                    });
                });
                return count;
            })
            .then(function (finalCount) {
                resolve(
                    `Added \`${finalCount}\` songs from the playlist to the queue.`
                );
            })
            .catch((error) => {
                if (error instanceof GaxiosError) {
                    resolve('Unable to find playlist. Make sure the link was copied correctly and try again.');
                }
            });
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription(commands.playlist)
        .addStringOption((option) =>
            option
                .setName('link')
                .setDescription('Enter a YouTube playlist link')
                .setRequired(true)
        ),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction
                .followUp('ur trolling join a channel first')
                .catch(console.error);
        }

        const permissions = voiceChannel.permissionsFor(
            interaction.client.user
        );

        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return await interaction
                .followUp('Unable to join your channel. Make sure this bot has permission to join it!')
                .catch(console.error);
        }

        const response = await playPlaylist(interaction);
        return await send(interaction, response);
    }
};
