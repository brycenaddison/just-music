const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction
} = require('discord.js');
const { displayTime } = require('../utils/displayTime');
const { color } = require('../config.json');
const commands = require('./commands.json');

async function list(interaction, page = 1) {
    const serverQueue = interaction.client.queue.get(interaction.guild.id);

    if (!serverQueue) interaction.message.delete();

    const results = generateContent(serverQueue, page);
    page = results[2];

    const menu = new MessageEmbed()
        .setColor(color)
        .setTitle('Current Queue')
        .setDescription(results[0])
        .setThumbnail(serverQueue.songs[0].thumbnail);

    const row = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('delete')
            .setLabel('Delete')
            .setStyle('DANGER')
    );

    if (results[1] > 1) {
        menu.setFooter({
            text: `Page ${page}/${results[1]} | Use buttons to change page`
        });
        row.addComponents(
            new MessageButton()
                .setCustomId('left')
                .setLabel('Left')
                .setStyle('SECONDARY')
                .setDisabled(page == 1),
            new MessageButton()
                .setCustomId('right')
                .setLabel('Right')
                .setStyle('SECONDARY')
                .setDisabled(page == results[1])
        );
    }

    const content = { embeds: [menu], components: [row] };

    if (interaction instanceof MessageComponentInteraction) {
        return await interaction.update(content).catch(console.error);
    }

    return await interaction
        .followUp(content)
        .then((newmsg) => {
            newmsg
                .createMessageComponentCollector({
                    filter: (i) => {
                        return i.user.id == interaction.user.id;
                    }
                })
                .on('collect', async (i) => {
                    if (i.customId == 'left') {
                        await list(i, (page = page - 1));
                    } else if (i.customId == 'right') {
                        await list(i, (page = page + 1));
                    } else if (i.customId == 'delete') {
                        await newmsg.delete();
                    }
                });
        })
        .catch(console.error);
}

function generateContent(serverQueue, page) {
    if (page < 1) page = 1;

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
        if (page > pages.length) page = pages.length;
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
        const serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            return await interaction
                .followUp('nothins playin right now dawg')
                .catch(console.error);
        }

        return await list(interaction);
    }
};
