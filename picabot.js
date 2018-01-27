require("dotenv").config();
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const fs = require("fs");
const google = require("googleapis");
const youtube = google.youtube("v3");
//var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const bot = new Discord.Client();
const prefix = "$";
const botChannelName = "icwbot2";
const botlogchannel = "406504806954565644";
var fortunes = ["It is certain", "It is decidedly so", "Without a doubt", "Yes definitely", "You may rely of it", "As I see it, yes", "Most likely", "Outlook good", "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later", "Better not tell you now", "Cannot predict now", "Concentrate and ask again", "Dont count on it", "My reply is no", "My sources say no", "Outlook not so good", "Very doubtful"];
var dispatcher;
const songQueue = new Map();
var currentSongIndex = 0;
var previousSongIndex = 0;
var shuffle = false;
var autoremove = false;

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
//bot.login(config.token);


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

bot.on("message", function(message) {

	if (message.author.bot) return undefined;

	if (message.channel.type == "dm" || message.channel.type == "group") return undefined;

	if (!message.content.startsWith(prefix)) return undefined;

	const serverQueue = songQueue.get(message.guild.id);

    const args = message.content.substring(1).split(' ');
    //Get command from message
    let command = message.content.toLowerCase().split(" ")[0];
    //Remove prefix from command string
    command = command.slice(prefix.length);

    if (command === "help") {
		message.author.send("```Music commands are: \n   play     (add your music in the queue) \n   pause    (pause the player) \n   resume   (resume your player) \n   skip     (for next song) \n   prev     (for previous song) \n   stop     (stop & clear your player) \n   queue    (check queue list) \n   song     (view now playing) \n   random   (playing random song) ```", { reply: message });	
    }
    /*----------------------------------------------------------------------------------------------------------------
                                                until commands
    ------------------------------------------------------------------------------------------------------------------*/
    if (command === "say") {
        var args1 = message.content.split(/[ ]+/);
        message.delete();
        message.channel.send(args1.join("").substring(4));
    }

    if (command === "discrim") {
        const discrim = message.content.split(' ')[1];
        if (!discrim) return message.reply("oops! I could not find the discriminator that you had given.");
        if (typeof discrim !== 'integer')
            if (discrim.size < 4) return message.reply("Don't you know that discrims are 4 numbers? -.-");
        if (discrim.size > 4) return message.reply("Don't you know that discrims are 4 numbers? -.-");
        let members = bot.users.filter(c => c.discriminator === discrim).map(c => c.username).join('\n');
        if (!members) return message.reply("404 | No members have that discriminator!");
        let disembed = new Discord.RichEmbed()
            .setTitle("ICW Discrim Finder")
            .setDescription("Here are the discriminators I found!")
            .addField("Members:", `${members}#${discrim}`)
            .setColor('#008000');
        message.channel.send({ embed: disembed });
    }
    /*---------------------------------------------------------------------------------------------------------------------
    info commands
    ----------------------------------------------------------------------------------------------------------------------*/
    if (command === "invite") {
        message.author.send("Invite URL: https://discordapp.com/oauth2/authorize?client_id=376292306233458688&scope=bot");
    }

    if (command === "info") {
        var infoembed = new Discord.RichEmbed()
            .setAuthor("Hi " + message.author.username.toString(), message.author.avatarURL)
            .setTitle("info")
            .setColor()
            .setDescription(`this bot for music and fun \nDevloped by PK#1650 \nTry with ${prefix}help \nsupport server:\n[link](https://discord.gg/zFDvBay) \nbot invite link:\n[invite](https://discordapp.com/oauth2/authorize?client_id=376292306233458688&scope=bot)`)
            .setThumbnail("https://images-ext-1.discordapp.net/external/v1EV83IWPZ5tg7b5NJwfZO_drseYr7lSlVjCJ_-PncM/https/cdn.discordapp.com/icons/268683615632621568/168a880bdbc1cb0b0858f969b2247aa3.jpg?width=80&height=80")
            .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
            .setTimestamp();
        message.channel.send({ embed: infoembed });
    }

    if (command === "uptime") {
        var days = Math.floor(bot.uptime / 86400000000000);
        var hours = Math.floor(bot.uptime / 3600000);
        var minutes = Math.floor((bot.uptime % 3600000) / 60000);
        var seconds = Math.floor(((bot.uptime % 360000) % 60000) / 1000);
        const uptimeembed = new Discord.RichEmbed()
            .setColor([0, 38, 255])
            .addField('Uptime', `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        message.channel.send({ embed: uptimeembed });
    }
    /*------------------------------------------------------------------------------------------
    music commands
    -------------------------------------------------------------------------------------------*/
    if (command === "play") {
        if (message.member.voiceChannel !== undefined) {
            if (args.length > 0) {
                var query = "";
                for (var i = 0; i < args.length - 1; i++) {
                    query += args[i] + " ";
                }
                query += " " + args[args.length - 1];
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


    if (command === "skip") {
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
                    bot.user.setPresence({ game: { name: "", type: 0 } });
                    serverQueue.songs = [];
                    currentSongIndex = 0;
                    message.member.voiceChannel.leave();
                    var finishembed = new Discord.RichEmbed()
                        .setColor(0x00FFFF)
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
                    .setColor(0x008000)
                    .setAuthor("Finished playing by stop command", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                    .setDescription("thanks for using see you soon bye bye 👋")
                    .setFooter("Stoped by: " + message.author.username.toString(), message.author.avatarURL)
                    .setTimestamp();
                message.channel.send({ embed: stopembed });
            }
            /*else if(args.length > 0){
            	var index = Number.parseInt(args[0]);
            	if(Number.isInteger(index)){
            		message.channel.send(`\`${serverQueue[index - 1].title}\` has been removed from the song queue`, {reply: message});
            		serverQueue.songs.splice(index - 1, 1);
            		if(index - 1 <= currentSongIndex){
            			currentSongIndex--;
            		}
            	} else{
            		message.channel.send(`\`${args[0]}\` is an invalid index`, {reply: message});
            	}
            } else{
            	dispatcher.end("clear");
            	currentSongIndex = 0;
            	serverQueue = [];
            	//bot.user.setGame(currentSong.title);
            	//Workaround since above wouldn't work
            	bot.user.setPresence({ game: { name: serverQueue.songs[0].title, type: 0 } });
            	message.member.voiceChannel.leave();
            	message.channel.send("The song queue has been cleared", {reply: message});
            }*/
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

    if (command === "song") {
        if (!message.guild.me.voiceChannel) {
            message.channel.send("bot is not in voice channel and nothing to play", { reply: message });
            return;
        }
        if (serverQueue.songs.length > 0) {
            var songembed = new Discord.RichEmbed()
                .setColor(0xFF007F)
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

    if (command === "queue") {
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
                .setColor(0xFF007F)
                .setAuthor("The song queue of " + message.guild.name + " currently has:", icon.toString())
                .setDescription(`${songList}`)
                .setFooter("Developed by: PK#1650 ", "https://cdn.discordapp.com/attachments/399064303170224131/405585474988802058/videotogif_2018.01.24_10.14.40.gif")
                .setTimestamp();
            message.channel.send({ embed: queueembed });
        } else {
            message.channel.send("No song is in the queue", { reply: message });
        }
    }

    if (command === "volume") {
        if (message.member.voiceChannel !== undefined) {
            if (!message.guild.me.voiceChannel) {
                message.channel.send("bot is not in voice channel", { reply: message });
                return;
            }
            if (args[1] > 100) {
                message.channel.send("Invalid Volume! Please provide a volume from 1 to 100.");
                return;
            }
            if (args[1] < 1) {
                message.channel.send("Invalid Volume! Please provide a volume from 1 to 100.");
                return;
            }
            if (isNaN(args[1])) {
                message.channel.send(`please provide a valid input. example \`${prefix}volume 100\``, { reply: message });
                return;
            }
            serverQueue.volume[message.guild.id] = args[1];
            dispatcher.setVolumeLogarithmic(args[1] / 80);
            var setvolembed = new Discord.RichEmbed()
                .setColor(0xFFEF00)
                .setAuthor("volume controls", "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
                .setDescription(`volume set ${args[1]}%`)
                .setThumbnail("https://images-ext-1.discordapp.net/external/v1EV83IWPZ5tg7b5NJwfZO_drseYr7lSlVjCJ_-PncM/https/cdn.discordapp.com/icons/268683615632621568/168a880bdbc1cb0b0858f969b2247aa3.jpg?width=80&height=80")
                .setFooter("Changed by: " + message.author.username.toString(), message.author.avatarURL)
                .setTimestamp();
            message.channel.send({ embed: setvolembed });
            //}
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
                .setColor(0xCC0000)
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
            }).catch(console.log);
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
            .setColor(0x002FA7)
            .setAuthor(`Now ${(shuffle) ? "randomly " : ""}playing \`${currentSong.title}\``, "https://cdn.discordapp.com/attachments/398789265900830760/405592021579989003/videotogif_2018.01.24_10.46.57.gif")
            .setDescription("link here: " + `[click](${currentSong.url})`)
            .setURL(`${currentSong.url}`)
            .setThumbnail(`${currentSong.thumbnail}`)
            .setFooter("Requested by: " + `${currentSong.user}`, currentSong.usravatar)
            .setTimestamp();
        message.channel.send({ embed: nowplayembed });
        //bot.user.setGame(currentSong.title);
        //Workaround since above wouldn't work
        dispatcher.player.on("warn", console.warn);
        dispatcher.on("warn", console.warn);
        dispatcher.on("error", console.error);
        dispatcher.once("end", function(reason) {
            bot.channels.get(botlogchannel).send("Song ended because: " + reason);
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
                            .setColor(0x008000)
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
