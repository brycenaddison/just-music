const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { displayTime } = require('../utils/displayTime');
const { color } = require('../config.json');
const commands = require('./commands.json');

async function list(interaction, page = 1, existingMessage = null) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) {
        return await interaction
            .followUp('nothins playin right now dawg')
            .catch(console.error);
    }

    if (existingMessage) {
        const reactions = existingMessage.reactions.cache;
        try {
            for (const reaction of reactions.values()) {
                await reaction.users.remove(interaction.user.id);
            }
        } catch (error) {
            console.error('Failed to remove reactions.');
        }
    }

    const results = generateContent(serverQueue, page);
    page = results[2];
    const menu = new MessageEmbed()
        .setColor(color)
        .setTitle('Current Queue')
        .setDescription(results[0])
        .setThumbnail(serverQueue.songs[0].thumbnail);
    if (results[1] > 1) {
        menu.setFooter(
            { text: `Page ${page}/${results[1]} | Use arrows to change page` }
        );
    }
    (existingMessage
        ? existingMessage.edit(menu)
        : interaction.followUp({ embeds: [menu] })
    ).then(async (newmsg) => {
        if (results[1] <= 1) return;

        Promise.all([newmsg.react('⬅️'), newmsg.react('➡️')]).catch(() =>
            console.error('One of the emojis failed to react.')
        );

        newmsg
            .createReactionCollector((reaction, user) => {
                return (
                    user.id == interaction.user.id &&
                    (reaction.emoji.name === '⬅️' ||
                        reaction.emoji.name === '➡️')
                );
            })
            .once('collect', async (reaction) => {
                const chosen = reaction.emoji.name;
                if (chosen === '⬅️') {
                    await list(
                        interaction,
                        (page = page - 1),
                        (existingMessage = newmsg)
                    );
                } else if (chosen === '➡️') {
                    await list(
                        interaction,
                        (page = page + 1),
                        (existingMessage = newmsg)
                    );
                }
            });
    });
}

function generateContent(serverQueue, page) {
    if (page < 1) page++;

    let content = '';
    const pages = [];
    const queueLength = Object.keys(serverQueue.songs).length;
    let totalTime = 0;
    let inQueue = 0;

    if (!serverQueue.loop) {
        content += `Currently Playing: [**${serverQueue.songs[0].title}**](${
            serverQueue.songs[0].url
        }) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
        if (queueLength < 2) {
            content += '\nNothing else is queued. Use /play to add a song!\n';
        } else {
            content += '\n**Up next:**\n';
        }
        for (let i = 1; i < Object.keys(serverQueue.songs).length; i++) {
            if (pages[Math.floor(i / 10)] == null) {
                pages[Math.floor(i / 10)] = `${i}. [${
                    serverQueue.songs[i].title
                }](${serverQueue.songs[i].url}) \`${displayTime(
                    serverQueue.songs[i].length
                )}\`\n`;
            } else {
                pages[Math.floor(i / 10)] += `${i}. [${
                    serverQueue.songs[i].title
                }](${serverQueue.songs[i].url}) \`${displayTime(
                    serverQueue.songs[i].length
                )}\`\n`;
            }
            totalTime += serverQueue.songs[i].length;
            inQueue++;
        }
        while (page > pages.length) page--;
        if (pages[page - 1]) content += pages[page - 1];
        let s = '';
        if (queueLength > 2) s = 's';
        if (queueLength > 1) {
            content += `\n${inQueue} song${s} in queue | \`${displayTime(
                totalTime
            )}\` total runtime`;
        }

        if (content.length > 2048) {
            console.log('[CHECK] Message too long: ' + content);
            content = content.substring(0, 2048);
        }
    } else {
        content += `Currently Looping: [**${serverQueue.songs[0].title}**](${
            serverQueue.songs[0].url
        }) \`${displayTime(serverQueue.songs[0].length)}\`\n`;
        content += `\nLooped **${serverQueue.loop_count}** ${
            serverQueue.loop_count === 1 ? 'time' : 'times'
        } for a total of \`${displayTime(
            serverQueue.loop_count * serverQueue.songs[0].length
        )}\`\n`;
        content += '\nType /loop to disable looping.';
    }
    if (!serverQueue.playing) {
        content += 'Playback is paused. Use /pause again to resume playback.';
    }
    return [content, pages.length, page];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription(commands.queue),
    async execute(interaction) {
        await list(interaction);
    }
};
