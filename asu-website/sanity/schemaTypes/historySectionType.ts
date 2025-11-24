// /sanity/schemaTypes/historySectionType.ts
import { defineType, defineField } from "sanity";

export default defineType({
    name: "historySection",
    title: "History Section",
    type: "document",
    fields: [
        defineField({
            name: "year",
            title: "Year",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "title",
            title: "Section Title",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "content",
            title: "Description / Bullet Points",
            type: "array",
            of: [{ type: "block" }],
        }),

        defineField({
            name: "images",
            title: "Images",
            type: "array",
            of: [{ type: "image" }],
        }),
    ],
});
