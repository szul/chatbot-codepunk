import * as restify from "restify";
import * as builder from "../node_modules/botbuilder/lib/botbuilder";

var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);
var intents = new builder.IntentDialog();

bot.dialog('/', intents);

intents.matches(/^what's new/i, [
    function (session) {
        session.beginDialog('/init');
    },
    function (session, results) {
        session.send('The latest on #codepunk is...');
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.question) {
            session.beginDialog('/init');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello, user. End of line.');
    }
]);

bot.dialog('/init', [
    function (session) {
        builder.Prompts.text(session, 'What can we help you with? End of line.');
    },
    function (session, results) {
        session.userData.question = results.response;
        session.endDialog();
    }
]);
