# winston_the_bot
Winston is a bot. He's here to help.

## Running
* Install dependencies: `npm install keybase-bot pdfkit feedparser request`
* Create `bot-paper-key.txt` (line 1: the username, line 2: the paperkey)
* Create (empty) directory `images/`
* `node winston.js`

---

## PNG to PDF
* monitors channel `png2pdf`
* attachments are saved to `/images`
* when `convert` is sent: all files in `/images` are made into a PDF, in alphabetical order; the PDF (called `homework.pdf`) is sent and the images are deleted


## XKCD
* monitors channel `xkcd`
* a simple IFTT recipe sends `xkcd?` when the RSS feed is updated, using the webhookbot
* when `xkcd?` is sent, the RSS feed is checked; any comic posted within 15 minutes is downloaded and sent

---
_____onsite, in progress_____