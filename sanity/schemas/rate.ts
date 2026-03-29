import { defineField, defineType } from "sanity";

export default defineType({
  name: "rate",
  title: "Rate",
  type: "document",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "string",
      description: 'e.g. "up to 4 hrs"',
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: 'e.g. "From £350"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "price" },
  },
  orderings: [
    {
      title: "Sort Order",
      name: "sortOrder",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});
