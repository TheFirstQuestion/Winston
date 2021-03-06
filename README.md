# Winston
Winston is a bot. He's here to help. He's like [J.A.R.V.I.S.](https://en.wikipedia.org/wiki/J.A.R.V.I.S.), but less alive.

**W**inston **I**s **N**ot **S**ome **T**oy, **O**kay **N**erds?

## Running
* Install dependencies: `npm install keybase-bot pdfkit feedparser request codetheweb/tuyapi`
* Create `bot-paper-key.txt` (line 1: the username, line 2: the paperkey)
* Create (empty) directory `images/`
* create `config.js` (example is provided, real values are only needed if controlling lights)
* `node winston.js`

---

## PNG to PDF
* monitors channel `png2pdf`
* attachments are saved to `/images`
* when `convert` is sent: all files in `/images` are made into a PDF, in alphabetical order; the PDF (called `homework.pdf`) is sent and the images are deleted


## XKCD
* monitors channel `xkcd`
* a simple IFTT recipe sends `xkcd?` when the RSS feed is updated, using the Keybase webhookbot
* when `xkcd?` is sent, the RSS feed is checked; any comic posted within 15 minutes is downloaded and sent


## Lights
* Light strip is controlled via IFTT
* Power strip is controlled via API (see setup instructions at https://github.com/codetheweb/tuyapi/blob/master/docs/SETUP.md)
* IFTT Webhook URLs and TuyAPI object should be stored in `config.js` (an example is provided)

---
_____onsite, in progress_____
