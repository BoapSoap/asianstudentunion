// /sanity/schemaTypes/homeCarouselImageType.ts
import { defineType, defineField } from "sanity";

export default defineType({
    name: "homeCarouselImage",
    title: "Home Carousel Image",
    type: "document",
    fields: [
        defineField({
            name: "sortOrder",
            title: "Slide Order (1 = first, 2 = second...)",
            type: "number",
            description:
                "Controls which slide this image appears in on the home carousel. Example: 1 = first slide, 2 = second slide, 3 = third slide.",
        }),
        defineField({
            name: "image",
            title: "Image",
            type: "image",
            options: { hotspot: true },
            validation: (Rule) => Rule.required(),
        }),
        defineField({
            name: "alt",
            title: "Alt Text (Accessibility)",
            type: "string",
            description: "Short description of the image for screen readers.",
        }),
    ],
});
