import { defineField, defineType } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "contactEmail",
      title: "Contact Email",
      type: "string",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "footerHeadline",
      title: "Footer Headline",
      type: "string",
      initialValue: "Let's work together",
    }),
    defineField({
      name: "footerPitch",
      title: "Footer Pitch",
      type: "text",
      rows: 3,
      initialValue:
        "Have a project in mind? I'd love to hear about it. Every collaboration starts with a conversation.",
    }),
    defineField({
      name: "links",
      title: "Social Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "platform", title: "Platform", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
          preview: {
            select: { title: "platform", subtitle: "url" },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Settings" };
    },
  },
});
