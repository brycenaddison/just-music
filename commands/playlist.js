const { SlashCommandBuilder } = require('@discordjs/builders');
const commands = require('./commands.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('playlist')
		.setDescription(commands.playlist),
	async execute(interaction) {
		await interaction.reply('Not yet implemented.');
	},
};

/**
            const urlParams = new URLSearchParams(matches[10]);

            if (urlParams.has('list')) {

                // interaction.editReply({ content: 'Playlists not yet supported.', ephemeral: true });

                /*
                const playlistId = urlParams.get('list');
                const origVideoId = urlParams.get('v');
                let count = 0;

                interaction.client.youtube.playlistItems.list({
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

                                await execute(interaction, playlistSongInfo, true);
                            }
                        });
                        return count;
                    },
                    function(err) {
                        console.error('Execute error', err);
                    },
                ).then(async function(finalCount) {
                    return await interaction.editReply(`Adding \`${finalCount + 1}\` songs from the playlist to the queue.`)
                        .catch(console.error);
                });

            }

        }
        catch (err) {
            console.error(err);
            return await interaction.editReply('Unknown error encountered. Check logs.')
                .catch(console.error);
        }
        */