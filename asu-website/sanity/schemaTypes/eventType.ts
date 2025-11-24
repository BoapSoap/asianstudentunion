// /sanity/schemaTypes/eventType.ts
import { defineType, defineField } from "sanity";

export default defineType({
    name: "event",
    title: "Event",
    type: "document",
    fields: [
        defineField({
            name: "featured",
            title: "Featured Event?",
            type: "boolean",
            initialValue: false,
            description:
                "If checked, this event appears as the Featured Event on the homepage and gets its own detail page.",
        }),

        defineField({
            name: "title",
            title: "Event Title",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "slug",
            title: "Slug (Used for Learn More Page URL)",
            type: "slug",
            options: {
                source: "title",
                maxLength: 96,
            },
            // Only required when the event is featured
            validation: (Rule) =>
                Rule.custom((value, context) => {
                    const isFeatured = (context as any)?.document?.featured;
                    if (isFeatured && !value?.current) {
                        return "Slug is required for featured events (used for the detail page URL).";
                    }
                    return true;
                }),
        }),

        defineField({
            name: "date",
            title: "Event Date",
            type: "date",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "time",
            title: "Event Time",
            type: "string",
        }),

        defineField({
            name: "location",
            title: "Location",
            type: "string",
        }),

        defineField({
            name: "link",
            title: "Sign Up / External Link",
            type: "url",
            description:
                "Optional link to a signup form, tickets, or external page. For featured events this powers the yellow Sign Up button if set.",
            validation: (Rule) =>
                Rule.uri({
                    allowRelative: false,
                    scheme: ["http", "https"],
                }),
        }),

        defineField({
            name: "image",
            title: "Main Image",
            type: "image",
            options: { hotspot: true },
            description: "This image is shown on the homepage cards and on the featured event detail page.",
        }),

        defineField({
            name: "description",
            title: "Event Description",
            type: "array",
            of: [{ type: "block" }],
            description:
                "Longer description shown on the featured event detail page and in the event popup.",
        }),
    ],
});
