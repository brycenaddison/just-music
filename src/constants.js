import { loadJSON } from './utils/fs.js';

export const { version } = await loadJSON('../package.json', import.meta.url);
export const { prefix, color } = await loadJSON(
    '../config.json',
    import.meta.url
);
export const commands = await loadJSON(
    './commands/commands.json',
    import.meta.url
);
export const {
    play,
    skip,
    stop,
    help,
    queue,
    loop,
    remove,
    pause,
    shuffle,
    clear,
    playlist
} = commands;
