const ytdl = require('ytdl-core');

module.exports = {
    search: async (query, youtube) => {
        return new Promise((resolve) => {
            const regex =
                /(([a-z]+:\/\/)?(([a-z0-9-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-.~]+)*(\/([a-z0-9_\-.]*)(\?[a-z0-9+_\-.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
            const matches = regex.exec(query);

            if (matches != null) {
                try {
                    const songInfo = ytdl.getInfo(matches[0]);
                    resolve(songInfo);
                } catch (err) {
                    console.error(err);
                    resolve(err);
                }
            }

            youtube.search.list(
                {
                    part: 'snippet',
                    q: query,
                    maxResults: 1,
                    type: 'video'
                },
                async function (err, data) {
                    if (err) {
                        console.error(err);
                        resolve(err);
                    }
                    if (data) {
                        if (data.data.items.length === 1) {
                            try {
                                const songInfo = await ytdl.getInfo(
                                    'https://youtube.com/watch?v=' +
                                        data.data.items[0].id.videoId
                                );
                                resolve(songInfo);
                            } catch (err) {
                                console.error(err);
                                resolve(err);
                            }
                        } else {
                            resolve(null);
                        }
                    }
                }
            );
        });
    }
};
