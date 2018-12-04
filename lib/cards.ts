import { CardFactory, Attachment } from "botbuilder";

export function createAudioCard(title: string, summary: string, url: string, encUrl: string): Attachment {
    return CardFactory.audioCard(
        title,
        [
            { url: encUrl }
        ],
        [],
        {
            subtitle: summary
        });
}

export function createThumbnailCard(title: string, summary: string, linkUrl: string, imageUrl: string): Attachment {
    return CardFactory.thumbnailCard(
        title,
        "",
        [
            { url: imageUrl }
        ],
        CardFactory.actions([
            {
                type: "openUrl",
                title: "Read more...",
                value: linkUrl.replace("http://", "https://"),
                channelData: undefined
            }
        ]),
        {
            subtitle: summary
        }
    );
}
