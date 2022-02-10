module.exports = {
    send: async (interaction, message) => {
        return await interaction
            .followUp(message)
            .catch(`Fatal error encountered: ${console.error}`);
    }
};
