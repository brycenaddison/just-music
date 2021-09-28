import fs from 'fs/promises';

export async function loadJSON(path, url) {
    return JSON.parse(await fs.readFile(new URL(path, url)));
}
