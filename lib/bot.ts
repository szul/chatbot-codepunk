import { TurnContext, MessageFactory } from "botbuilder";
import { Post, PostType, Author } from "./schema";
import { getPost } from "./parser";
import { createAudioCard, createThumbnailCard } from "./cards";

export class RSSBot {
    private readonly _posts;
    constructor(posts: Post[]) {
        this._posts = posts;
    }
    async onTurn(context: TurnContext) {
        if (context.activity.type === "message") {
            if(context.activity.text.match(/from bill|by bill/i)) {
                let latest: Post = getPost(this._posts, PostType.Author, Author.Ahern);
                await context.sendActivity(`The latest from Bill on Codepunk is titled "${latest.title}" and was published on ${latest.pubdate.toDateString()}`);
                await context.sendActivity(MessageFactory.attachment(createThumbnailCard(latest.title, latest.link, latest.image.url)));
            }
            else if(context.activity.text.match(/from michael|by michael/i)) {
                let latest: Post = getPost(this._posts, PostType.Author, Author.Szul);
                await context.sendActivity(`The latest from Michael on Codepunk is titled "${latest.title}" and was published on ${latest.pubdate.toDateString()}`);
                await context.sendActivity(MessageFactory.attachment(createThumbnailCard(latest.title, latest.link, latest.image.url)));
            }
            else if(context.activity.text.match(/latest podcast|latest episode|newest podcast|newest episode/i)) {
                let latest: Post = getPost(this._posts, PostType.Enclosure);
                await context.sendActivity(`The latest podcast episode on Codepunk is titled "${latest.title}" and was published on ${latest.pubdate.toDateString()}`);
                await context.sendActivity(MessageFactory.attachment(createAudioCard(latest.title, latest.link, latest.enclosure.url)));
            }
            else if(context.activity.text.match(/latest article|last article|latest blog post|last blog post|newest blog post|newest article/i)) {
                let latest: Post = getPost(this._posts, PostType.Article);
                await context.sendActivity(`The latest blog post on Codepunk is titled "${latest.title}" and was published on ${latest.pubdate.toDateString()}`);
                await context.sendActivity(MessageFactory.attachment(createThumbnailCard(latest.title, latest.link, latest.image.url)));
            }
            else if(context.activity.text.match(/^what's new|^what's up|^whats new|^whats up/i)) {
                let latest: Post = this._posts;
                let postType = (latest.enclosure == null) ? "an article" : "a podcast";
                await context.sendActivity(`The latest on Codepunk is ${postType} titled "${latest.title}" and was published on ${latest.pubdate.toDateString()}`);
                await context.sendActivity(MessageFactory.attachment(createThumbnailCard(latest.title, latest.link, latest.image.url)));
            }
            else {
                await context.sendActivity("Sorry, I didn't understand what you said :(");
            }
        }
    }
}
