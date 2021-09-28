module.exports = {
    displayTime: (total_seconds) => {
        const hours = Math.floor(total_seconds / 3600);
        let minutes = Math.floor((total_seconds % 3600) / 60);
        let seconds = Math.floor(total_seconds % 60);
        minutes = (Math.floor(minutes / 10) === 0 ? "0" : "") + minutes;
        seconds = (Math.floor(seconds / 10) === 0 ? "0" : "") + seconds;
        return hours === 0
            ? `${minutes}:${seconds}`
            : `${hours}:${minutes}:${seconds}`;
    }
};
