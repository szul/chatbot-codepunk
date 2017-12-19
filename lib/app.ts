import * as restify from "restify";
import * as builder from "botbuilder";
//import * as azure from "botbuilder-azure";
import * as request from "request";

var azure = require("botbuilder-azure");
require("dotenv-extended").load();

const FEEDURL = "https://codepunk.io/rss/";

const TABLENAME = process.env.TABLENAME;
const STORAGENAME = process.env.STORAGENAME;
const STORAGEKEY = process.env.STORAGEKEY;

enum PostType {
     Article = 1
    ,Enclosure = 2
    ,Author = 3
}

enum Author {
     Ahern = 1
    ,Szul = 2
}

interface Image {
      url: string
    , title?: string
}

interface Enclosure {
      url: string
    , type?: string
    , length?: number
}

interface Post {
      title: string
    , description?: string
    , summary?: string
    , link: string
    , pubdate: Date
    , author: string
    , image?: Image
    , enclosure?: Enclosure
}

var Posts: Array<Post> = [];
var feedparser = require('feedparser');
var feed = request(FEEDURL);
var parsed = new feedparser();

feed.on("response", (resp) => {
    feed.pipe(parsed);
    launchServer((server)=> {
        launchBot(server);
    });
});

parsed.on("readable", () => {
    let item = null;
    while (item = parsed.read()) {
        let image: Image = getImage(item);
        let enclosure: Enclosure = getEnclosure(item);
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

function getImage(item: any): Image {
    if(item.image != null && item.image.url != null) {
        return item.image;
    }
    if(item.enclosures != null) {
        for(let i = 0; i < item.enclosures.length; i++) {
            if(item.enclosures[i].type === "image") {
                return {
                    url: item.enclosures[i].url
                };
            }
        }
    }
}

function getEnclosure(item: any): Enclosure {
    if(item.enclosures != null) {
        for(let i = 0; i < item.enclosures.length; i++) {
            if(item.enclosures[i].type === "audio/mpeg") {
                return { 
                      url: item.enclosures[i].url
                    , type: item.enclosures[i].type
                    , length: item.enclosures[i].length
                };
            }
        }
    }
}

function launchServer(callback): void {
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, () => {
        console.log('%s listening to %s', server.name, server.url); 
    });
    callback(server);    
}

function launchBot(server): void {
    function getPost(postType: PostType, author?: Author): Post {
        let latest: Post = null;
        for(let i = 0; i < Posts.length; i++) {
            if(postType === PostType.Enclosure && Posts[i].enclosure != null && Posts[i].enclosure.url != null) {
                latest = Posts[i];
                break;
            }
            else if(postType === PostType.Article && Posts[i].image != null && Posts[i].image.url != null) {
                latest = Posts[i];
                break;
            }
            else if(postType === PostType.Author && author === Author.Ahern && Posts[i].author.toLowerCase().indexOf("ahern") !== -1) {
                latest = Posts[i];
                break;
            }
            else if(postType === PostType.Author && author === Author.Szul && Posts[i].author.toLowerCase().indexOf("szul") !== -1) {
                latest = Posts[i];
                break;
            }
        }
        return latest;
    }
    var connector = new builder.ChatConnector({
        appId: process.env.MICROSOFT_APP_ID,
        appPassword: process.env.MICROSOFT_APP_PASSWORD
    });
    var tableClient = new azure.AzureTableClient(TABLENAME, STORAGENAME, STORAGEKEY);
    var tableStorage = new azure.AzureBotStorage({ gzipData: false }, tableClient);
    var bot = new builder.UniversalBot(connector).set("storage", tableStorage);
    server.post('/api/messages', connector.listen());

    var intents = new builder.IntentDialog();

    bot.dialog('/', intents);

    intents.matches(/^version/i, (session) => {
        session.send("#codepunk bot alpha v.0.0.5"); //Need to load from package.json
    });

    intents.matches(/from bill|by bill/i, [
        (session) => {
            let latest: Post = getPost(PostType.Author, Author.Ahern);
            session.send('The latest from Bill on #codepunk is titled "%s" and was published on %s', latest.title, latest.pubdate.toDateString());
            session.send(new builder.Message(session).addAttachment(createThumbnailCard(session, latest.title, latest.link, latest.image.url)));
        }
    ]);

    intents.matches(/from michael|by michael/i, [
        (session) => {
            let latest: Post = getPost(PostType.Author, Author.Szul);
            session.send('The latest from Michael on #codepunk is titled "%s" and was published on %s', latest.title, latest.pubdate.toDateString());
            session.send(new builder.Message(session).addAttachment(createThumbnailCard(session, latest.title, latest.link, latest.image.url)));
        }
    ]);

    intents.matches(/latest podcast|latest episode|newest podcast|newest episode/i, [
        (session) => {
            let latest: Post = getPost(PostType.Enclosure);
            session.send('The latest podcast episode on #codepunk is titled "%s" and was published on %s', latest.title, latest.pubdate.toDateString());
            session.send(new builder.Message(session).addAttachment(createAudioCard(session, latest.title, latest.link, latest.enclosure.url, latest.image.url)));
        }
    ]);

    intents.matches(/latest article|last article|latest blog post|last blog post|newest blog post|newest article/i, [ //You can make all of these more regex-y
        (session) => {
            let latest: Post = getPost(PostType.Article);
            session.send('The latest blog post on #codepunk is titled "%s" and was published on %s', latest.title, latest.pubdate.toDateString());
            session.send(new builder.Message(session).addAttachment(createThumbnailCard(session, latest.title, latest.link, latest.image.url)));
        }
    ]);

    intents.matches(/^what's new|^what's up|^whats new|^whats up/i, [
        (session) => {
            let latest: Post = Posts[0];
            let postType = (latest.enclosure == null) ? "an article" : "a podcast";
            session.send('The latest on #codepunk is %s titled "%s" and was published on %s', postType, latest.title, latest.pubdate.toDateString());
            session.send(new builder.Message(session).addAttachment(createThumbnailCard(session, latest.title, latest.link, latest.image.url)));
        }
    ]);

    intents.onDefault([
        (session, args, next) => {
            if (!session.userData.name) {
                session.beginDialog('/init');
            } else {
                next();
            }
        },
        (session, results) => {
            session.send('Hello, %s. What may we help you with?', session.userData.name);
        }
    ]);

    bot.dialog('/init', [
        (session) => {
            if(!session.userData.name) {
                builder.Prompts.text(session, 'What may we call you?');
            }
            else {
                session.send('Input not recognized, %s.', session.userData.name);
            }
        },
        (session, results) => {
            session.userData.name = results.response;
            session.endDialog();
        }
    ]);
}

function createAudioCard(session: any, title: string, url: string, encUrl: string, imageUrl: string): any {
    return new builder.AudioCard(session)
        .title(title)
        .subtitle("")
        .text("")
        .image(builder.CardImage.create(session, imageUrl))
        .media(<any>[
            { url: encUrl }
        ]);
}

function createThumbnailCard(session: any, title: string, linkUrl: string, imageUrl: string): any {
    return new builder.ThumbnailCard(session)
        .title(title)
        .subtitle("")
        .text("")
        .images([
            builder.CardImage.create(session, imageUrl)
        ])
        .buttons([
            builder.CardAction.openUrl(session, linkUrl.replace("http://", "https://"), "Read more...")
        ]);
}
