const Bot = require('keybase-bot');
const PDFDocument = require('pdfkit');
const FeedParser = require('feedparser');
const request = require('request');
const fs = require('fs');
const https = require('https');
const bot = new Bot()

//////////// config /////////////
const PWD_FILE = "bot-paper-key.txt"
const IMG_DIR = "images/";
const PDF_NAME = "homework.pdf";
const XKCD_FEED = "https://www.xkcd.com/rss.xml";
const XKCD_IMG_NAME = "xkcd.jpg";
/////////////////////////////////


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

            if (channel == "png2pdf") {
                if (message.content.type == 'attachment') {
                    bot.chat.download(message.conversationId, message.id, IMG_DIR + message.content.attachment.object.filename);
                    return;
                }
                if (message.content.text.body.startsWith('convert')) {
                    makePDF();
                    bot.chat.attach(message.conversationId, PDF_NAME);
                }
            }

            if (channel == "xkcd") {
                if (message.content.text.body.startsWith("xkcd?")) {
                    getRSSFeed((new Date()).getTime(), message.conversationId);
                }
            }

            if (channel == "testing") {
                console.log(message);
            }

            // If not text, quit
            if (message.content.type !== 'text') {
                return
            }

            if (message.content.text.body.startsWith('PING')) {
                bot.chat.send(message.conversationId, {
                    body: "PONG",
                });
            }

            if (message.content.text.body.startsWith('!echo ')) {
                bot.chat.send(message.conversationId, {
                    body: message.content.text.body.substr(6),
                });
            }

            return;
        }

        const onError = e => console.error(e);
        console.log(`Listening for messages...`);
        await bot.chat.watchAllChannelsForNewMessages(onMessage, onError);
    } catch (error) {
        console.error(error);
    }

}

async function shutDown() {
    await bot.deinit()
    process.exit()
}

//////////////////////////// helper functions /////////////////////
function makePDF() {
    const doc = new PDFDocument({autoFirstPage: false});
    doc.pipe(fs.createWriteStream(PDF_NAME));

    var arrayOfFiles = [];
    try {
        arrayOfFiles = fs.readdirSync(IMG_DIR)
    } catch(e) {
        console.log(e)
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
            console.log(err);
        }
    }

    doc.end();
    return;
}

function getRSSFeed(timeNow, channel) {
    var req = request(XKCD_FEED)
    var feedparser = new FeedParser();

    req.on('error', function (error) {
        console.log(error);
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
        console.log(error);
    });

    feedparser.on('readable', function () {
        var stream = this;
        var meta = this.meta;
        var item;

        while (item = stream.read()) {
            //console.log(item);
            var title = item.title;
            var imgUrl = item.summary.split('"')[1];
            var altText = item.summary.split('"')[3];
            // This is in minutes
            var delta = (timeNow - item.pubDate.getTime()) / (1000 * 60);
            if (delta < 15) {
                // Download the file
                const file = fs.createWriteStream(XKCD_IMG_NAME);
                const request = https.get(imgUrl, function(response) {
                    response.pipe(file);
                });
                // Send it
                bot.chat.attach(channel, XKCD_IMG_NAME, {
                    title: "*" + title + ":* " + altText,
                });
            } else {
                console.log("entry too old.");
            }
        }
    });
}
//////////////////////////////////////////////////////////////////



process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)

main()
