import { Enclosure, Image, PostType, Author, Post } from "./schema";

export function getImage(item: any): Image {
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

export function getEnclosure(item: any): Enclosure {
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

export function getPost(posts: Post[], postType: PostType, author?: Author): Post {
    let latest: Post = null;
    for(let i = 0; i < posts.length; i++) {
        if(postType === PostType.Enclosure && posts[i].enclosure != null && posts[i].enclosure.url != null) {
            latest = posts[i];
            break;
        }
        else if(postType === PostType.Article && posts[i].image != null && posts[i].image.url != null) {
            latest = posts[i];
            break;
        }
        else if(postType === PostType.Author && author === Author.Ahern && posts[i].author.toLowerCase().indexOf("ahern") !== -1) {
            latest = posts[i];
            break;
        }
        else if(postType === PostType.Author && author === Author.Szul && posts[i].author.toLowerCase().indexOf("szul") !== -1) {
            latest = posts[i];
            break;
        }
    }
    return latest;
}
