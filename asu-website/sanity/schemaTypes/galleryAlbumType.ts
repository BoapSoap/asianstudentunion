// /sanity/schemaTypes/galleryAlbumType.ts
import { defineType, defineField } from "sanity";

export default defineType({
    name: "galleryAlbum",
    title: "Gallery Album",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Album Title",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "date",
            title: "Album Date",
            type: "date",
            description: "Date of the event or when the photos were taken.",
        }),

        defineField({
            name: "coverImage",
            title: "Cover Image",
            type: "image",
            options: { hotspot: true },
            description: "Shown on the gallery page as the album thumbnail.",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "description",
            title: "Short Description",
            type: "string",
            description: "Optional: a short sentence about the event.",
        }),

        defineField({
            name: "googlePhotosUrl",
            title: "Google Photos Album Link",
            type: "url",
            description: "Share link to the Google Photos album.",
            validation: (Rule) =>
                Rule.uri({
                    scheme: ["http", "https"],
                    allowRelative: false,
                }).required(),
        }),
    ],
});
