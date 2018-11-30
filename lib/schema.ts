export enum PostType {
    Article = 1
   ,Enclosure = 2
   ,Author = 3
}

export enum Author {
    Ahern = 1
   ,Szul = 2
}

export interface Image {
     url: string
   , title?: string
}

export interface Enclosure {
     url: string
   , type?: string
   , length?: number
}

export interface Post {
     title: string
   , description?: string
   , summary?: string
   , link: string
   , pubdate: Date
   , author: string
   , image?: Image
   , enclosure?: Enclosure
}
