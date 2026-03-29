import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "gavin-batty-photography",
  title: "Gavin Batty Photography",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            // Site Settings — singleton
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.divider(),
            // Categories
            S.documentTypeListItem("category").title("Categories"),
            // Rates
            S.documentTypeListItem("rate").title("Rates"),
            // Shoot Types
            S.documentTypeListItem("shootType").title("Shoot Types"),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
});
