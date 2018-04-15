const Discord = require("discord.js");
const bot = new Discord.Client();

module.exports = function (lul) {
  bot.on("message", async(message) => {
    if message.content.startsWith("test") {
      message.channel.send("gg")
    }
  })
}
