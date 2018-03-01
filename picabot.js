require("dotenv").config();
const request = require('request');
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const fs = require("fs");
const google = require("googleapis");
const youtube = google.youtube("v3");
//var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const bot = new Discord.Client();
const prefix = "##";
const botChannelName = "icwbot2";
const botlogchannel = "406504806954565644";
const botmlogchannel = "409055298158985216";
const botbuglogchannel = "418642505509240836";
const botowner = "264470521788366848";
var fortunes = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely of it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Dont count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"];
var dispatcher;
const songQueue = new Map();
var currentSongIndex = 0;
var previousSongIndex = 0;
var shuffle = false;
var autoremove = false;
const owmkey = process.env.KEY_WEATHER;
const Cleverbot = require('cleverbot-node');
const clbot = new Cleverbot();
var Heroku = require('heroku.node');
var hbot = new Heroku({ email: 'pardeepsingh1236512365@gmail.com', api_key: 'Process.env.H_APIKEY' });
const { inspect } = require("util");
const cheerio = require('cheerio');
const snekfetch = require('snekfetch');
const querystring = require('querystring');

bot.on("ready", function() {
    console.log("Bot ready");
    bot.channels.get(botlogchannel).send("bot ready");
});
bot.on("disconnect", function() {
    console.log("Bot disconnected");
    bot.channels.get(botlogchannel).send("bot disconnected");
    process.exit(1);
});

bot.on("messageUpdate", function(oldMessage, newMessage) {
    checkForCommand(newMessage);
});

bot.login(process.env.BOTTOKEN).then(function() {
    console.log("Bot logged in");
    bot.user.setPresence({ status: `streaming`, game: { name: `${prefix}help | ${bot.users.size} Users`, type: `STREAMING`, url: `https://www.twitch.tv/pardeepsingh12365` } });
    bot.channels.get(botlogchannel).send("bot logged in");
}).catch(console.log);


fs.readFile("save.json", function(err, data) {
    if (err) {
        if (err.code === "ENOENT") {
            console.log("save.json does not exist");
            fs.writeFile("save.json", "{}", "utf8", function(err) {
                if (err) throw err;
                console.log("save.json created");
            });
        } else {
            throw err;
        }
    }
});

bot.on("message", async(message) => {
    if (!message.content.startsWith(prefix)) {
        return undefined;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if(command == "gsearch" || command === "google" || command === "g") {
        let args3 = message.content.substring(command.length + 2);
        let searchMessage = await message.reply('Searching... Sec.');
        let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(args3)}`;  
        return snekfetch.get(searchUrl).then((result) => {
            let $ = cheerio.load(result.text);
            let googleData = $('.r').first().find('a').first().attr('href');
            googleData = querystring.parse(googleData.replace('/url?', ''));
            searchMessage.edit(`Result found!\n${googleData.q}`);
        }).catch((err) => {
            searchMessage.edit('No results found!');
        });
    }

    if (command === "eval") {
        if (message.author.id !== botowner) {
            message.reply('this command is only for bot owner!!!');
            return;
        }
        if (/bot.token/.exec(message.content.split(" ").slice(1).join(" "))) return message.channel.send("I think im not idiot");
        const code = args.join(" ");
        const token = bot.token.split("").join("[^]{0,2}");
        const rev = bot.token.split("").reverse().join("[^]{0,2}");
        const filter = new RegExp(`${token}|${rev}`, "g");
        try {
            let output = eval(code);
            if (output instanceof Promise || (Boolean(output) && typeof output.then === "function" && typeof output.catch === "function")) output = await output;
            output = inspect(output, { depth: 0, maxArrayLength: null });
            output = output.replace(filter, "[TOKEN]");
            output = clean(output);
            if (output.length < 1950) {
                message.channel.send(`\`\`\`js\n${output}\n\`\`\``);
            } else {
                message.channel.send(`${output}`, { split: "\n", code: "js" });
            }
        } catch (error) {
            message.channel.send(`The following error occured \`\`\`js\n${error}\`\`\``);
        }
    }
    function clean(text) {
        return text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203));
    }
});

bot.on('message', message => {
    if (message.author.bot) return undefined;
    if (message.channel.type == "dm" || message.channel.type == "group") return undefined;
    if (message.content.startsWith(`<@${bot.user.id}>`) || message.content.startsWith(`icw`) || message.content.startsWith(`Icw`) || message.content.startsWith(`ICW`)) {
        clbot.configure({ botapi: process.env.CLEVERBOT_KEY });
        Cleverbot.prepare(() => {
            clbot.write(message.content, (response) => {
                message.channel.startTyping();
                //setTimeout(() => {
                message.channel.send(response.message);
                message.channel.stopTyping();
                //}, Math.random() * (1 - 3) + 1 * 600);
            });
        });
        return;
    }
});

bot.on("message", function(message) {
    bot.user.setPresence({ status: `streaming`, game: { name: `${prefix}help | ${bot.users.size} Users`, type: `STREAMING`, url: `https://www.twitch.tv/pardeepsingh12365` } });

    if (message.author.bot) return undefined;

    if (!message.content.startsWith(prefix)) return undefined;

    const randomcolor = '0x' + Math.floor(Math.random() * 16777215).toString(16);

    const args = message.content.substring(prefix.length + 1).split();
    let command = message.content.toLowerCase().split(" ")[0];
    command = command.slice(prefix.length);
    if (command === "restart") {
        message.channel.send("bot restarting");
        let alldynos = hbot.app('testicw').dynos.list;
        message.channel.send(alldynos);
        hbot.app('testicw').dynos.restart(console.log('Restarting due to Termination Request.'));
    }

    if (command === "help") {
        let helpembed = new Discord.RichEmbed()
            .setColor(randomcolor)
            .setAuthor("Hi " + message.author.username.toString(), message.author.avatarURL)
            .setDescription(`ICW help Section \nPrefix = ${prefix} \nvolume command is for all users \nmore commands coming soon`)
            .addField("Bot info commands", `invite - (bot invite link)\nbotinfo - (info about the bot)\`\`info , botstatus\`\` \nuptime - (uptime of the bot)\nservers - (bots servers)`)
            .addField("until commands", `cleverbot - (talk with bot with mention or icw \`\`example - icw hi\`\`) \`\`icw\`\` \ngoogle - (search anything) \`\`gsearch , g , \`\` \nweather - (check your city weather) \nsay - (bot saying your message) \ndiscrim - (found any discriminators) \nserverinfo - (info about server)`)
            .addField("Modration command", `warn - (for warning a member) \n kick - (for kick a member) \n ban - (for ban a member)`)
            .addField("Music commands", `play - (for serach and add your song in thre queue) \`\`p\`\` \npause - (pause the player) \nresume - (resume the player) \nvolume - (set your player volume) \`\`sv , setvolume\`\` \nskip - (for next song) \`\`s , next\`\` \nprev - (for previos song) \nstop - (for stop the player) \nqueue - (for check playlist) \`\`q , playlist\`\` \nsong - (view current song) \`\`np , nowplaying\`\` \nrandom - (playing randomly)`)
            .setThumbnail("https://media.discordapp.net/attachments/406099961730564107/407455733689483265/Untitled6.png?width=300&height=300")
            .setFooter("Bot Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
            .addField("if you find any bug plz report it with command",`bugreport - (report for any bugs or problams) \`\`bug\`\``)
            .addField("support server", `[link](https://discord.gg/zFDvBay)`, inline = true)
            .addField("bot invite link", `[invite](https://discordapp.com/oauth2/authorize?client_id=376292306233458688&scope=bot)`, inline = true)
            .addField("please give upvote", `[vote and invite link](https://discordbots.org/bot/376292306233458688)`, inline = true)
            .addField("help with donate", `[patreon](https://www.patreon.com/icw)`, inline = true)
            .setTimestamp();
        message.author.send({ embed: helpembed });
        message.channel.send("check your dms", { replay: message }).then(sent => sent.delete({ timeout: 9999 }));
    }
    /*----------------------------------------------------------------------------------------------------------------
                                                UNTIL COMMANDS
    ------------------------------------------------------------------------------------------------------------------*/
    if (command === "say") {
        message.delete();
        message.channel.send(args.join("").substring(3));
    }

    if (command === "sayall") {
        if (message.author.id !== botowner) {
            message.reply('this command is only for bot owner!!!');
            return;
        }
        message.delete();
        bot.users.map(u => u.send(args.join("").substring(6)));
    }

    if (command === "bugreport" || command === "bug") {
        let args2 = args.join("").substring(command.length);
        if (!args2) return message.channel.send(`***plz add a bug message after command***`);
        message.channel.send(`***Report sented succesfully thank you***`);
        bot.channels.get(botbuglogchannel).send(`report by: **${message.author.tag}** from: **${message.guild.name}** (${message.guild.id}) \nbug: ${args2}`);
    }

    if (command === "us") {
        if (message.author.id !== botowner) {
            message.reply('this command is only for bot owner!!!');
            return;
        }
        bot.user.setPresence({ status: `streaming`, game: { name: `${prefix}help | ${bot.users.size} Users`, type: `STREAMING`, url: `https://www.twitch.tv/pardeepsingh12365` } });
        message.channel.send("stream updated");
    }

    if (command === "servers") {
        let guilds = bot.guilds.map((guild) => `**${guild.name}** members: ${guild.members.size} id: (${guild.id})`);
        message.channel.send(`I'm in the **${bot.guilds.size} guilds**:\n${guilds.join ('\n')}`);
    }

    if (command === "weather") {
        var cityname = args.join("").substring(7);
        var http = require('http');
        request({
            url: 'http://api.openweathermap.org/data/2.5/weather?q=' + cityname + '&APPID=' + owmkey
        }, (error, response, body) => {
            if (error) return;
            var data = JSON.parse(body);
            if (data.cod == "404") {
                message.channel.send(data.message);
                return;
            }
            var weather_main = parseFloat(data.main.temp) - 273.15;
            var temp_max = parseFloat(data.main.temp_max) - 273.15;
            var temp_min = parseFloat(data.main.temp_min) - 273.15;
            const embed = new Discord.RichEmbed()
                .setTitle(data.name + ',' + data.sys.country)
                .setAuthor("ICW weather info", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                .setColor(randomcolor)
                .setDescription(data.weather[0].description)
                .setThumbnail("http://openweathermap.org/img/w/" + data.weather[0].icon + ".png")
                .setURL("https://openweathermap.org/city/" + data.name)
                .addField("main", weather_main + " c", true)
                .addField("pressure", data.main.pressure + " Hpz", true)
                .addField("wind", data.wind.speed + " mph" + "/ Direction" + data.wind.deg, true)
                .addField("visibility", data.visibility, true)
                .setFooter("Requested by " + message.author.username.toString(), message.author.avatarURL)
                .setTimestamp();
            message.channel.send({ embed });
        });
    }

    /*    if (command === "leaveserver") {
            if(message.author.id !== botowner) {
                message.reply('this command is only for bot owner!!!');
                return;
            }
            var args3 = message.content.substring(12);
            let guild = bot.guilds.get(args3[0]);
            message.channel.send(args3);
            message.channel.send(`guild ${guild}`);
            //guild.leave();
            message.channel.send('Left guild.');
        }*/

    if (command === "discrim") {
        //let args3 = message.content.substring(prefix.length).split(' ');
        //const discrims = message.content.split(' ')[1];
        const discrim = args.join("").substring(7);
        if (!discrim) return message.reply("oops! I could not find the discriminator that you had given.");
        if (typeof discrim !== 'integer')
            if (discrim.size < 4) return message.reply("Don't you know that discrims are 4 numbers? -.-");
        if (discrim.size > 4) return message.reply("Don't you know that discrims are 4 numbers? -.-");
        let members = bot.users.filter(c => c.discriminator === discrim).map(c => c.username).join(`\n`);
        if (!members) return message.reply("404 | No members have that discriminator!");
        message.channel.send(`\`\`\`ICW Discrim Finder\nI found these discriminators.\n\n${members}\`\`\``);
    }
    /*---------------------------------------------------------------------------------------------------------------------
                                                INFO COMMANDS
    ----------------------------------------------------------------------------------------------------------------------*/
    if (command === "invite") {
        message.channel.send("Invite URL: https://discordapp.com/oauth2/authorize?client_id=376292306233458688&scope=bot");
        message.channel.send("please check your dms", { replay: message }).then(sent => sent.delete({ timeout: 99 }));
    }

    if (command === "botinfo" || command === "info" || command === "botstatus") {
        let TextChannels = bot.channels.filter(e => e.type !== 'voice').size;
        let VoiceChannels = bot.channels.filter(e => e.type === 'voice').size;
        var infoembed = new Discord.RichEmbed()
            .setAuthor("Hi " + message.author.username.toString(), message.author.avatarURL)
            .setTitle("info")
            .setColor(randomcolor)
            .setDescription(`this bot for music with volume control and fun`)
            .addField("Devloped by", `PK#1650`, inline = true)
            .addField("Try with", `${prefix}help`, inline = true)
            .addField("CPU", `${process.cpuUsage().user/1024} MHz`, inline = true)
            .addField("Ram", `${process.memoryUsage().rss/1024} kb`, inline = true)
            .addField("Totel Guilds", `${bot.guilds.size}`, inline = true)
            .addField("Totel Channels", `${bot.channels.size}`, inline = true)
            .addField("Totel Text Channels", `${TextChannels}`, inline = true)
            .addField("Totel Voice Channels", `${VoiceChannels}`, inline = true)
            .addField("Totel Users", `${bot.users.size}`)
            .addField("support server", `[link](https://discord.gg/zFDvBay)`, inline = true)
            .addField("bot invite link", `[invite](https://discordapp.com/oauth2/authorize?client_id=376292306233458688&scope=bot)`, inline = true)
            .setThumbnail("https://media.discordapp.net/attachments/406099961730564107/407455733689483265/Untitled6.png?width=300&height=300")
            .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
            .addField("please give me vote", `[vote and invite link](https://discordbots.org/bot/376292306233458688)`, inline = true)
            .addField("help with donate", `[patreon](https://www.patreon.com/icw)`, inline = true)
            .setTimestamp();
        message.channel.send({ embed: infoembed });
    }

    if (command === "uptime") {
        var days = Math.floor(bot.uptime / 86400000000000);
        var hours = Math.floor(bot.uptime / 3600000);
        var minutes = Math.floor((bot.uptime % 3600000) / 60000);
        var seconds = Math.floor(((bot.uptime % 360000) % 60000) / 1000);
        const uptimeembed = new Discord.RichEmbed()
            .setColor(randomcolor)
            .addField('Uptime', `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        message.channel.send({ embed: uptimeembed });
    }
    /*---------------------------------------------------------------------------------------------
                        no dm commands (only for server channels)
    ---------------------------------------------------------------------------------------------*/
    if (message.channel.type == "dm" || message.channel.type == "group") return undefined;
    const serverQueue = songQueue.get(message.guild.id);

    if (command === "warn"){
        let warnUser = message.mentions.members.first();
        if (!warnUser) return message.channel.send(`Specify a user to warn`);
        let args2 = message.content.substring(prefix.length + command.length).split(`<@${warnUser.user.id}>`);
        let reason = args2.join(" ").substring(3);
        if (!reason) return message.channel.send("You did not give a reason to warn the user.");
        if(!warnUser.id == message.author.id) return message.channel.send("You cannot warn yourself/!");
        message.delete();
        warnUser.send(`**you have been warned from** ${message.guild}. \n**Reason**: ${reason}`);
        message.channel.send(`***${warnUser.user.tag} has been warned***`)

    }

    if (command === "kick") {
        if (!message.guild.member(bot.user).hasPermission("KICK_MEMBERS")) return message.channel.send(`I don't have permission to do that`);
        if (!message.member.hasPermission("KICK_MEMBERS")) return message.channel.send(`U don't have permission to do that`);
        let kickUser = message.mentions.members.first();
        if (!kickUser) return message.channel.send(`Specify a user to kick`);
        let args2 = message.content.substring(prefix.length + command.length).split(`<@${kickUser.user.id}>`);
        let reason = args2.join(" ").substring(3);
        if (!reason) return message.channel.send("You did not give a reason to kick the user.")
        if(!kickUser.id == message.author.id) return message.channel.send("You cannot kick yourself/!");
        if (!kickUser.kickable) return message.channel.send("my role is either the same or lower than the user you wish to kick.");
        kickUser.send(`**You have been kicked from** ${message.guild}. \n**Reason**: ${reason}`);
        try {
            message.guild.member(kickUser).kick();
            var kickembed = new Discord.RichEmbed()
            .setColor(randomcolor)
            .setAuthor("Action by : " + message.author.username.toString(), message.author.avatarURL)
            .setDescription(`**Action**: Kick \n**Mamber**: ${kickUser.user.tag} (${kickUser.id}) \n**Reason**: ${reason}`)
            .setTimestamp();
            message.channel.send({embed: kickembed});
        } catch (err) {
                message.channel.send(`I failed to kick the user... Reason: ${err}`);
        }
    }

    if (command === "ban") {
        if (!message.guild.member(bot.user).hasPermission("BAN_MEMBERS")) return message.channel.send(`I don't have permission to do that`);
        if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send(`You don't have permission to do that`);
        let banUser = message.mentions.members.first();
        if (!banUser) return message.channel.send(`Specify a user to ban`);
        let args2 = message.content.substring(prefix.length + command.length).split(`<@${banUser.user.id}>`);
        let reason = args2.join(" ").substring(3);
        if (!reason) return message.channel.send("You did not give a reason to ban the user.")
        if(!banUser.id == message.author.id) return message.channel.send("You cannot ban yourself/!");
        if (!banUser.bannable) return message.channel.send("my role is either the same or lower than the user you wish to ban.");
        kickUser.send(`**You have been baned from** ${message.guild}. \n**Reason**: ${reason}`);
        try {
            message.guild.member(banUser).ban();
            var banembed = new Discord.RichEmbed()
            .setColor(randomcolor)
            .setAuthor("Action by : " + message.author.username.toString(), message.author.avatarURL)
            .setDescription(`**Action**: ban \n**Mamber**: ${banUser.user.tag} (${banUser.id}) \n**Reason**: ${reason}`)
            .setTimestamp();
            message.channel.send({embed: banembed});
        } catch (err) {
                message.channel.send(`I failed to ban the user... Reason: ${err}`);
        }
    }

    if (command === "serverinfo") {
        let guildTchannels = message.guild.channels.filter(e => e.type !== 'voice').size;
        let guildVchannels = message.guild.channels.filter(e => e.type === 'voice').size;
        let serverowner = message.guild.owner.user.tag;
        let serverownerid = message.guild.owner.id;
        let servermembers = message.guild.memberCount;
        let serveronlinemembers = message.guild.members.filter(m => m.user.presence.status !== "offline").size;
        let serveroflinemembers = message.guild.members.filter(m => m.user.presence.status === "offline").size;
        let serverroles = message.guild.roles.size;
        let serverregion = message.guild.region;
        let servercreatedat = message.guild.createdAt;
        let sicon = message.guild.iconURL;
        var serverinfoembed = new Discord.RichEmbed()
            .setAuthor(message.guild.name + "info", sicon.toString())
            .setColor(randomcolor)
            .setDescription(`Since: ${servercreatedat}`)
            .addField("Server Owner:", `${serverowner}`, inline = true)
            .addField("Owner id:", `${serverownerid}`, inline = true)
            .addField("Members:", `${serveronlinemembers}/${servermembers}`, inline = true)
            .addField("Totel Roles:", `${serverroles}`, inline = true)
            .addField("Text channel:", `${guildTchannels}`, inline = true)
            .addField("Voice channels:", `${guildVchannels}`, inline = true)
            .addField("Server Region:", `${serverregion}`)
            .setThumbnail(`${sicon}`)
            .setFooter("Bot Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
            .setTimestamp();
        message.channel.send({ embed: serverinfoembed });
    }
    /*------------------------------------------------------------------------------------------
                                            MUSIC COMMANDS
    -------------------------------------------------------------------------------------------*/
    if (command === "play" || command === "p") {
        if (message.member.voiceChannel !== undefined) {
            if (args.length > 0) {
                //var query = "";
                //for (var i = 0; i < args.length - 1; i++) {
                //query += args[i] + " ";
                //}
                //query += " " + args[args.length - 1];
                let query = args.join("").substring(command.length);
                var results = youtube.search.list({
                    "key": process.env.GOOGLEAPIKEY,
                    "q": query,
                    "type": "video",
                    "maxResults": "1",
                    "part": "snippet"
                }, function(err, data) {
                    if (err) {
                        message.channel.send("There was an error searching for your song :cry:", { reply: message });
                        console.log("Error: " + err);
                    }
                    if (data) {
                        if (data.items.length === 0) {
                            message.channel.send(`There were no results for \`${query}\``);
                        } else {
                            addSong(message, "https://www.youtube.com/watch?v=" + data.items[0].id.videoId);
                        }
                    }
                });
            } else {
                message.channel.send(`You can search for a youtube song with \`${prefix}play <query>\``, { reply: message });
            }
        } else {
            message.channel.send("You can't hear my music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "resume") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue && !serverQueue.playing) {
                serverQueue.playing = true;
                dispatcher.resume();
                return message.channel.send('▶ Resumed the music for you!');
            }
            return message.channel.send('There is nothing playing.');
        } else {
            message.channel.send("You can't resume music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "pause") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue && serverQueue.playing) {
                serverQueue.playing = false;
                dispatcher.pause();
                return message.channel.send('⏸ Paused the music for you!');
            }
            return message.channel.send('There is nothing playing.');
        } else {
            message.channel.send("You can't pause music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "prev") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue.songs.length > 0) {
                previousSongIndex = currentSongIndex;
                var amount = Number.parseInt(args[0]);
                if (Number.isInteger(amount)) {
                    currentSongIndex -= amount;
                } else {
                    currentSongIndex--;
                }
                if (currentSongIndex < 0) {
                    currentSongIndex = 0;
                }
                dispatcher.end("prev");
            } else {
                message.channel.send("There are no more songs :sob:", { reply: message });
            }
        } else {
            message.channel.send("You can't prev music if you're not in a voice channel :cry:", { reply: message });
        }
    }


    if (command === "skip" || command === "next" || command === "s") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue.songs.length > 0) {
                previousSongIndex = currentSongIndex;
                var amount = Number.parseInt(args[0]);
                if (Number.isInteger(amount)) {
                    currentSongIndex += amount;
                } else {
                    currentSongIndex++;
                }
                if (currentSongIndex > serverQueue.songs.length - 1) {
                    currentSongIndex = serverQueue.songs.length - 1;
                    //bot.user.setGame(currentSong.title);
                    //Workaround since above wouldn't work
                    //bot.user.setPresence({ game: { name: "", type: 0 } });
                    serverQueue.songs = [];
                    currentSongIndex = 0;
                    message.member.voiceChannel.leave();
                    var finishembed = new Discord.RichEmbed()
                        .setColor(randomcolor)
                        .setAuthor("Finished playing because no more song in the queue", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                        .setDescription("please add more song if you like 🎧")
                        .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
                        .setTimestamp();
                    message.channel.send({ embed: finishembed });
                }
                dispatcher.end("next");
            } else {
                message.channel.send("There are no more songs :sob:", { reply: message });
            }
        } else {
            message.channel.send("You can't hear my music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "goto") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue.songs.length > 0) {
                var index = Number.parseInt(args[0]);
                if (Number.isInteger(index)) {
                    previousSongIndex = currentSongIndex;
                    currentSongIndex = index - 1;
                    if (currentSongIndex < 0) {
                        currentSongIndex = 0;
                    } else if (currentSongIndex > serverQueue.length - 1) {
                        currentSongIndex = serverQueue.length - 1;
                    }
                    dispatcher.end("goto");
                } else {
                    message.channel.send(`\`${args[0]}\` is an invalid index`, { reply: message });
                }
            } else {
                message.channel.send("There are no more songs :sob:", { reply: message });
            }
        } else {
            message.channel.send("You can't hear my music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "random") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue.songs.length > 0) {
                currentSongIndex = Math.floor(Math.random() * serverQueue.songs.length);
                dispatcher.end("random");
            } else {
                message.channel.send("There are no more songs :sob:", { reply: message });
            }
        } else {
            message.channel.send("You can't hear my music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "stop") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
                return;
            }
            if (serverQueue.songs.length === 0) {
                message.channel.send("There are no songs to clear", { reply: message });
            } else {
                dispatcher.end("stopping");
                currentSongIndex = 0;
                serverQueue.songs = [];
                message.member.voiceChannel.leave();
                var stopembed = new Discord.RichEmbed()
                    .setColor(randomcolor)
                    .setAuthor("Finished playing by stop command", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                    .setDescription("thanks for using see you soon bye bye 👋")
                    .setFooter("Stoped by: " + message.author.username.toString(), message.author.avatarURL)
                    .setTimestamp();
                message.channel.send({ embed: stopembed });
            }
        } else {
            message.channel.send("You can't stop music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "autoremove") {
        if (message.member.voiceChannel !== undefined) {
            if (autoremove) {
                autoremove = false;
                message.channel.send("Song autoremoval is now disabled", { reply: message });
            } else {
                autoremove = true;
                message.channel.send("Song autoremoval is now enabled", { reply: message });
            }
        } else {
            message.channel.send("You can't hear my music if you're not in a voice channel :cry:", { reply: message });
        }
    }

    if (command === "song" || command === "np" || command === "nowplaying") {
        if (!message.guild.me.voiceChannel) {
            message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
            return;
        }
        if (serverQueue.songs.length > 0) {
            var songembed = new Discord.RichEmbed()
                .setColor(randomcolor)
                .setAuthor(`The current song is \`${serverQueue.songs[currentSongIndex].title}\` 🎧`)
                .setDescription("link here: " + `[click](${serverQueue.songs[currentSongIndex].url})`)
                .setThumbnail(`${serverQueue.songs[currentSongIndex].thumbnail}`)
                .setFooter(`Added by ${serverQueue.songs[currentSongIndex].user}`, serverQueue.songs[currentSongIndex].usravatar)
                .setTimestamp();
            message.channel.send({ embed: songembed });
        } else {
            message.channel.send("No song is in the queue", { reply: message });
        }
    }

    if (command === "queue" || command === "q" || command === "playlist") {
        if (!message.guild.me.voiceChannel) {
            message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
            return;
        }
        if (serverQueue.songs.length > 0) {
            var songList = "";
            for (var i = 0; i < serverQueue.songs.length; i++) {
                if (i === currentSongIndex) {
                    songList += `__**\`${i + 1}. ${serverQueue.songs[i].title}\`**__\n`;
                } else {
                    songList += `\`${i + 1}. ${serverQueue.songs[i].title}\`\n`;
                }
            }
            var icon = message.guild.iconURL;
            var queueembed = new Discord.RichEmbed()
                .setColor(randomcolor)
                .setAuthor("The song queue of " + message.guild.name + " currently has:", icon.toString())
                .setDescription(`${songList}`)
                .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
                .setTimestamp();
            message.channel.send({ embed: queueembed });
        } else {
            message.channel.send("No song is in the queue", { reply: message });
        }
    }

    if (command === "volume" || command === "sv" || command === "setvolume") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel", { reply: message });
                return;
            }
            let args2 = args.join("").substring(command.length);
            if (args2 > 100) {
                message.channel.send("Invalid Volume! Please provide a volume from 1 to 100.");
                return;
            }
            if (args2 < 1) {
                message.channel.send("Invalid Volume! Please provide a volume from 1 to 100.");
                return;
            }
            if (isNaN(args2)) {
                message.channel.send(args2);
                message.channel.send(`please provide a valid input. example \`${prefix}volume 100\``, { reply: message });
                return;
            }
            serverQueue.volume[message.guild.id] = args2;
            dispatcher.setVolumeLogarithmic(args2 / 80);
            var setvolembed = new Discord.RichEmbed()
                .setColor(randomcolor)
                .setAuthor("volume controls", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                .setDescription(`volume set ${args2}%`)
                .setThumbnail("https://images-ext-1.discordapp.net/external/v1EV83IWPZ5tg7b5NJwfZO_drseYr7lSlVjCJ_-PncM/https/cdn.discordapp.com/icons/268683615632621568/168a880bdbc1cb0b0858f969b2247aa3.jpg?width=80&height=80")
                .setFooter("Changed by: " + message.author.username.toString(), message.author.avatarURL)
                .setTimestamp();
            message.channel.send({ embed: setvolembed });
            bot.channels.get(botmlogchannel).send(`**${message.author.username}** using volume command in **${message.guild.name}** volume: **${args2}**`);
        } else {
            message.channel.send("you cant change volume if you are not in voice channel", { reply: message });
        }
    }
});

var addSong = function(message, url) {
    const serverQueue = songQueue.get(message.guild.id);
    ytdl.getInfo(url).then(function(info) {
        var song = {};
        song.thumbnail = info.thumbnail_url;
        song.title = info.title;
        song.url = url;
        song.user = message.author.username;
        song.usravatar = message.author.avatarURL;

        //message.channel.send(song.title + " info retrieved successfully");
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: message.channel,
                connection: null,
                songs: [],
                volume: [],
                playing: true
            };

            //message.channel.send("Queue construct created successfully.");

            songQueue.set(message.guild.id, queueConstruct);

            //message.channel.send("songQueue set successfully");

            queueConstruct.songs.push(song);
        }
        //message.channel.send("queuecontrsuct pushed successfully.");
        else {
            var addsongembed = new Discord.RichEmbed()
                .setColor(randomcolor)
                .setAuthor(`I have added \`${info.title}\` to the song queue!`, "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                .setDescription("link here: " + `[click](${url})`)
                .setURL(`${url}`)
                .setThumbnail(`${song.thumbnail}`)
                .setFooter("Added by: " + message.author.username.toString(), message.author.avatarURL)
                .setTimestamp();
            message.channel.send({ embed: addsongembed });

            serverQueue.songs.push(song);
        }
        if (!bot.voiceConnections.exists("channel", message.member.voiceChannel)) {
            message.member.voiceChannel.join().then(function(connection) {
                playSong(message, connection);
            }).catch(); //removed consol log
        }
    }).catch(function(err) {
        message.channel.send(err + "\n\n\n");
        message.channel.send("Sorry I couldn't get info for that song :cry:", { reply: message });
    });
};

var playSong = function(message, connection) {
    const serverQueue = songQueue.get(message.guild.id);
    if (shuffle) {
        do {
            currentSongIndex = Math.floor(Math.random() * serverQueue.songs.length);
        } while (currentSongIndex === previousSongIndex);
    }

    var currentSong = serverQueue.songs[currentSongIndex];
    if (currentSong) {
        //message.channel.send("currentsong defined correctly");
        var stream = ytdl(currentSong.url, { "filter": "audioonly" });
        //message.channel.send("stream defined correctly");
        dispatcher = connection.playStream(stream, { volume: serverQueue.volume[message.guild.id] / 80 });
        //message.channel.send("dispatcher defined correctly");
        var nowplayembed = new Discord.RichEmbed()
            .setColor(randomcolor)
            .setAuthor(`Now ${(shuffle) ? "randomly " : ""}playing \`${currentSong.title}\``, "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
            .setDescription("link here: " + `[click](${currentSong.url})`)
            .setURL(`${currentSong.url}`)
            .setThumbnail(`${currentSong.thumbnail}`)
            .setFooter("Requested by: " + `${currentSong.user}`, currentSong.usravatar)
            .setTimestamp();
        message.channel.send({ embed: nowplayembed });
        bot.channels.get(botmlogchannel).send(`**${message.author.tag}**` + ` playing ` + `\`\`${currentSong.title}\`\`` + ` in ` + `**${message.guild.name}**` + ` server`);
        //bot.user.setGame(currentSong.title);
        //Workaround since above wouldn't work
        dispatcher.player.on("warn", console.warn);
        dispatcher.on("warn", console.warn);
        dispatcher.on("error", console.error);
        dispatcher.once("end", function(reason) {
            //bot.channels.get(botlogchannel).send("Song ended because: " + reason);
            if (reason === "user" || reason === "Stream is not generating quickly enough.") {
                if (autoremove) {
                    serverQueue.splice(currentSongIndex, 1);
                    if (serverQueue.songs.length === 0) {
                        //bot.user.setGame(currentSong.title);
                        //Workaround since above wouldn't work
                        message.member.voiceChannel.leave();
                    } else {
                        setTimeout(function() {
                            playSong(message, connection);
                        }, 500);
                    }
                } else {
                    currentSongIndex++;
                    if (currentSongIndex >= serverQueue.songs.length && !shuffle) {
                        //bot.user.setGame(currentSong.title);
                        //Workaround since above wouldn't work
                        message.member.voiceChannel.leave();
                        var finishembed = new Discord.RichEmbed()
                            .setColor(randomcolor)
                            .setAuthor("Finished playing because no more song in the queue", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                            .setDescription("please add more song if you like 🎧")
                            .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
                            .setTimestamp();
                        message.channel.send({ embed: finishembed });
                    } else {
                        setTimeout(function() {
                            playSong(message, connection);
                        }, 500);
                    }
                }
            } else if (reason === "prev" || reason === "next" || reason === "goto" || reason === "random") {
                setTimeout(function() {
                    playSong(message, connection);
                }, 500);
            }
        });
    }
};
const randomcolor = '0x' + Math.floor(Math.random() * 16777215).toString(16);
var checkForCommand = function(message) {
    if (!message.author.bot && message.content.startsWith(prefix)) {
        var args = message.content.substring(1).split(' ');
        var command = args.splice(0, 1);
        try {
            commands[command].process(message, args);
        } catch (e) {}
    }
};


function newFunction() {
    return queue.message.guild.id;
}
