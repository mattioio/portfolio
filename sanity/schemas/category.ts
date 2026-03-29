import { defineField, defineType } from "sanity";

export default defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      description: "Short tagline shown on the carousel and gallery header",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description: "Order in the carousel (1 = first)",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "cover",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      description: "Hero image used in the homepage carousel",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt Text",
              type: "string",
              description: "Describe this image for accessibility",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
        },
      ],
      description: "Drag to reorder. These appear in the gallery grid.",
    }),
  ],
  preview: {
    select: { title: "name", media: "cover", count: "photos" },
    prepare({ title, media }) {
      return { title, media };
    },
  },
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
