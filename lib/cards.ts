import { CardFactory, Attachment } from "botbuilder";

export function createAudioCard(title: string, url: string, encUrl: string): Attachment {
    return CardFactory.audioCard(
        title,
        [
            { url: encUrl }
        ],
        []);
}

export function createThumbnailCard(title: string, linkUrl: string, imageUrl: string): Attachment {
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
        ])
    );
}
