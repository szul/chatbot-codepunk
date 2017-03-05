import * as restify from "restify";
import * as builder from "botbuilder";
import * as request from "request";

var Posts: Array<Post> = [];

interface Image {
      url: string
    , title?: string
};

interface Enclosure {
      url: string
    , type?: string
    , length?: number
};

interface Post {
      title: string
    , description?: string
    , summary?: string
    , link: string
    , pubdate: Date
    , author: string
    , image?: Image
    , enclosure?: Enclosure
};

var feedparser = require('feedparser');

var feed = request("https://codepunk.io/rss/");
var parsed = new feedparser();

feed.on("response", (resp) => {
    feed.pipe(parsed);
    launchBot();
});

parsed.on("readable", () => {
    let item = null;
    while (item = parsed.read()) {
        let image: Image = item.image;
        let enclosure: Enclosure = (item.enclosures != null && item.enclosures.length > 0) ? item.enclosures[0] : null;
        let post: Post = {
              title: item.title
            , description: item.description
            , summary: item.summary
            , link: item.link
            , pubdate: item.pubdate
            , author: item.author
            , image: image
            , enclosure: enclosure
        };
        Posts.push(post);
    }
});

function launchBot(): void {

    var connector = new builder.ConsoleConnector().listen();
    var bot = new builder.UniversalBot(connector);
    var intents = new builder.IntentDialog();

    bot.dialog('/', intents);

    intents.matches(/^version/i, function (session) {
        session.send('#codepunk bot alpha v.0.0.1');
    });

    intents.matches(/^what's new|what's the latest/i, [
        function (session) {
            let latest: Post = Posts[0];
            let postType = (latest.enclosure == null) ? "an article" : "a podcast";
            session.send('The latest on #codepunk is %s titled "%s" which was published on %s', postType, latest.title, latest.pubdate);
            session.send('Here is the link: %s', latest.link);
        }
    ]);

    intents.onDefault([
        function (session, args, next) {
            if (!session.userData.name) {
                session.beginDialog('/init');
            } else {
                next();
            }
        },
        function (session, results) {
            session.send('Hello, user %s. What may we help you with? End of line.', session.userData.name);
        }
    ]);

    bot.dialog('/init', [
        function (session) {
            if(!session.userData.name) {
                builder.Prompts.text(session, 'What may we call you? End of line.');
            }
            else {
                session.send('Input not recognized user %s. End of line.', session.userData.name);
            }
        },
        function (session, results) {
            session.userData.name = results.response;
            session.endDialog();
        }
    ]);
}
