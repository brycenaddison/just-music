require("dotenv").config();
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const commands = [];
const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if ("data" in command) {
        commands.push(command.data.toJSON());
    }
}

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

if (process.argv.length > 1 && process.argv[1] === "-g") {
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID), {
        body: commands
    })
        .then(() =>
            console.log(
                "Successfully registered application commands GLOBALLY."
            )
        )
        .catch(console.error);
} else {
    rest.put(
        Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
        ),
        { body: commands }
    )
        .then(() =>
            console.log("Successfully registered application commands.")
        )
        .catch(console.error);
}
