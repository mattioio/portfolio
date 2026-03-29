import { defineField, defineType } from "sanity";

export default defineType({
  name: "shootType",
  title: "Shoot Type",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: 'e.g. "Wedding"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      description: 'e.g. "Intimate elopements to grand celebrations"',
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [{ type: "string" }],
      description: "Bullet points shown on the service card",
    }),
    defineField({
      name: "categorySlug",
      title: "Category Slug",
      type: "string",
      description: "Links this shoot type to a gallery category (e.g. 'wedding')",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle" },
  },
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
