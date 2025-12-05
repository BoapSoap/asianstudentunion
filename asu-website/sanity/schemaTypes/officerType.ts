// /sanity/schemaTypes/officerType.ts
import { defineType, defineField } from "sanity";

export default defineType({
    name: "officer",
    title: "Officer",
    type: "document",
    fields: [
        defineField({
            name: "sortOrder",
            title: "Display Order",
            type: "number",
            description:
                "Lower numbers show first on the Officer Board (e.g., 1 = President, 2 = VP, 3 = Treasurer, etc.).",
        }),

        defineField({
            name: "name",
            title: "Full Name",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "role",
            title: "Position",
            type: "string",
            validation: (Rule) => Rule.required(),
        }),

        defineField({
            name: "image",
            title: "Profile Image",
            type: "image",
            options: { hotspot: true },
        }),

        defineField({
            name: "major",
            title: "Major",
            type: "string",
        }),

        defineField({
            name: "year",
            title: "Grade Level / Year",
            type: "string",
        }),

        defineField({
            name: "email",
            title: "Email",
            type: "string",
            description: "Officer contact email (required).",
            validation: (Rule) => Rule.required().email(),
        }),

        defineField({
            name: "instagram",
            title: "Instagram Handle",
            type: "string",
            description: "Optional, e.g. @asf_officer. Shown only if filled in.",
        }),
        defineField({
            name: "linkedin",
            title: "LinkedIn URL or Handle",
            type: "string",
            description: "Optional. Accepts full URL or handle (we will build https://www.linkedin.com/in/{handle}).",
        }),

        defineField({
            name: "bio",
            title: "Short Intro / Bio",
            type: "text",
            rows: 3,
            description:
                "A short, friendly introduction (e.g., what you do in ASU, favorite hobbies, etc.).",
        }),
    ],
});
