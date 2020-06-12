const Bot = require('keybase-bot');
const PDFDocument = require('pdfkit');
const FeedParser = require('feedparser');
const request = require('request');
const fs = require('fs');
const https = require('https');
const TuyAPI = require('tuyapi');

//////////// constants /////////////
const PWD_FILE = "bot-paper-key.txt"
const IMG_DIR = "images/";
const PDF_NAME = "homework.pdf";
const XKCD_FEED = "https://www.xkcd.com/rss.xml";
const XKCD_IMG_NAME = "xkcd";
const XKCD_TIME_RANGE = 60;
/////////////////////////////////

// Include the config file
// https://stackoverflow.com/a/28066576
require('./config.js')();


const bot = new Bot()
async function main() {
    try {
        const file = fs.readFileSync(PWD_FILE, { encoding: 'utf8' }).split("\n");
        const username = file[0]
        const paperkey = file[1]

        await bot.init(username, paperkey)
        const info = bot.myInfo()
        console.log(`${info.username} initialized.`)

        await bot.chat.clearCommands()

        const onMessage = async message => {
            var channel = message.channel.topicName;
            var messageText = message.content.text.body;
            var words = parseMessage(messageText);

            if (channel == "png2pdf") {
                if (message.content.type == 'attachment') {
                    bot.chat.download(message.conversationId, message.id, IMG_DIR + message.content.attachment.object.filename);
                    return;
                }
                if (words.includes('convert')) {
                    makePDF();
                    bot.chat.attach(message.conversationId, PDF_NAME);
                }
            }

            if (channel == "xkcd") {
                getRSSFeed((new Date()).getTime(), message.conversationId);
            }

            if (channel == "testing") {
                console.log(message);
                console.log("---------------------------------\n");
            }

            // If not text, quit
            if (message.content.type !== 'text') {
                return
            }

            // Control the lights
            if (words.includes("lights")) {
                if (words.includes("on")) {
                    lightsOn();
                } else if (words.includes("off")) {
                    lightsOff();
                } else if (words.includes("dim")) {
                    lightsDim();
                }
            }

            // PING PONG (for testing)
            if (messageText.startsWith('PING')) {
                bot.chat.send(message.conversationId, {
                    body: "PONG",
                });
            }

            // !echo command (for testing)
            if (messageText.startsWith('!echo ')) {
                bot.chat.send(message.conversationId, {
                    body: message.content.text.body.substr(6),
                });
            }

            return;
        }

        const onError = e => console.error("Keybase Error 2: " + e);
        console.log(`Listening for messages...`);
        await bot.chat.watchAllChannelsForNewMessages(onMessage, onError);
    } catch (error) {
        console.error("Keybase Error 1: " + error);
    }

}

async function shutDown() {
    await bot.deinit()
    process.exit()
}

//////////////////////////// helper functions /////////////////////
function parseMessage(message) {
    var words = message.split(" ");
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
    }
    return words;
}

function makePDF() {
    const doc = new PDFDocument({autoFirstPage: false});
    doc.pipe(fs.createWriteStream(PDF_NAME));

    var arrayOfFiles = [];
    try {
        arrayOfFiles = fs.readdirSync(IMG_DIR)
    } catch(e) {
        console.log("Error Reading Directory: " + e)
    }

    for (i in arrayOfFiles) {
        var fname = IMG_DIR + arrayOfFiles[i];
        doc.addPage();
        // For some reason images are sideways by default
        doc.rotate(90);

        // No clue why this works...
        // https://stackoverflow.com/questions/51030194/using-rotate-for-images-leads-to-blank-pdf-with-pdfkit
        doc.image(fname, 0, -620, {
            height: 620,
            width: 795
        });

        // Delete the image
        try {
            fs.unlinkSync(fname);
        } catch (err) {
            console.log("Error Deleting Image: " + err);
        }
    }

    doc.end();
    return;
}

function getRSSFeed(timeNow, channel) {
    var req = request(XKCD_FEED);
    var feedparser = new FeedParser();

    req.on('error', function (error) {
        console.log("XKCD Feed Request Error: " + error);
    });

    req.on('response', function (res) {
        var stream = this;

        if (res.statusCode !== 200) {
            this.emit('error', new Error('Bad status code'));
        } else {
            stream.pipe(feedparser);
        }
    });

    feedparser.on('error', function (error) {
        console.log("FeedParser Error: " + error);
    });

    feedparser.on('readable', function () {
        var stream = this;
        var meta = this.meta;
        var item;

        while (item = stream.read()) {
            var title = item.title;
            var imgUrl = item.summary.split('"')[1];
            var altText = item.summary.split('"')[3];
            // This is in minutes
            var delta = (timeNow - item.pubDate.getTime()) / (1000 * 60);
            if (delta < XKCD_TIME_RANGE) {
                // Download the file
                const file = fs.createWriteStream(XKCD_IMG_NAME);
                const request = https.get(imgUrl, function(response) {
                    response.pipe(file);
                }).on("error", (err) => {
                    console.log("XKCD Image Request Error: " + err.message);
                });
                // Send it
                bot.chat.attach(channel, XKCD_IMG_NAME, {
                    title: "*" + title + ":* " + altText
                });
            } else {
                console.log("entry too old");
            }
        }
    });
}

// Add event listeners
device.on('connected', () => {
  console.log('Connected to device!');
});

device.on('disconnected', () => {
  console.log('Disconnected from device.');
});

device.on('error', error => {
  console.log('Error!', error);
});

async function lightsOn() {
    await device.find();
    await device.connect();
    await device.set({dps: 1, set: true});
    await device.set({dps: 4, set: true});
    await device.set({dps: 5, set: true});
    makeRequest(LIGHT_STRIP_ON);
    device.disconnect();
}

async function lightsOff() {
    await device.find();
    await device.connect();
    await device.set({dps: 1, set: false});
    await device.set({dps: 4, set: false});
    await device.set({dps: 5, set: false});
    makeRequest(LIGHT_STRIP_OFF);
    device.disconnect();
}

async function lightsDim() {
    await device.find();
    await device.connect();
    await device.set({dps: 1, set: true});
    await device.set({dps: 4, set: false});
    await device.set({dps: 5, set: true});
    makeRequest(LIGHT_STRIP_OFF);
    device.disconnect();
}

function makeRequest(url) {
    https.get(url, (resp) => {
        console.log("Request successful.")
    }).on("error", (err) => {
        console.log("Request Error: " + err.message);
    });
}
//////////////////////////////////////////////////////////////////



process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)

main()
