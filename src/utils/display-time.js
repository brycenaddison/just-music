import assert from 'assert';

export function displayTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');
    let seconds = Math.floor(totalSeconds % 60)
        .toString()
        .padStart(2, '0');
    return (hours ? `${hours}:` : '') + `${minutes}:${seconds}`;
}

function _test() {
    for (const [input, expected] of [
        [0, '00:00'],
        [1, '00:01'],
        [5, '00:05'],
        [10, '00:10'],
        [45, '00:45'],
        [60, '01:00'],
        [330, '05:30'],
        [630, '10:30'],
        [3600, '1:00:00'],
        [3630, '1:00:30'],
        [3930, '1:05:30'],
        [4230, '1:10:30']
    ]) {
        assert.equal(displayTime(input), expected);
    }
}
