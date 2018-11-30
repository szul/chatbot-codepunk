import { BotFrameworkAdapter, ConversationState } from "botbuilder";
import { TableStorage } from "botbuilder-azuretablestorage";
import { config } from "dotenv";
import * as restify from "restify";
import * as request from "request";
import { Enclosure, Image, Post } from "./schema";
import { getImage, getEnclosure } from "./parser";
import { RSSBot } from "./bot";

config();

const feedparser = require("feedparser");
const feed = request("https://codepunk.io/rss/");
const parsed = new feedparser();

const Posts: Post[] = [];

feed.on("response", (resp) => {
    feed.pipe(parsed);
    launchChatbot();
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

function launchChatbot(): void {

    const server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, function () {
        console.log(`${server.name} listening to ${server.url}`);
    });
    
    const adapter = new BotFrameworkAdapter({ 
        appId: (process.env.ENV == "PROD") ? process.env.MICROSOFT_APP_ID  : ""
        , appPassword: (process.env.ENV == "PROD") ? process.env.MICROSOFT_APP_PASSWORD : ""
    });

    const tableStorage = new TableStorage({ 
        tableName: process.env.TABLENAME
        , storageAccessKey: process.env.STORAGEKEY
        , storageAccountOrConnectionString: process.env.STORAGENAME
    });

    const conversationState = new ConversationState(tableStorage);

    const rssBot: RSSBot = new RSSBot(Posts);

    server.post("/api/messages", (req, res) => {
        adapter.processActivity(req, res, async (context) => {
            await rssBot.onTurn(context);
        });
    });

}
