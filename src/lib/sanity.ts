import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || "production";

/** Client is only created when a valid project ID is configured */
export const client: SanityClient | null =
  projectId && projectId !== "your-project-id"
    ? createClient({ projectId, dataset, apiVersion: "2024-01-01", useCdn: true })
    : null;

const builder = client ? imageUrlBuilder(client) : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) throw new Error("Sanity not configured — set PUBLIC_SANITY_PROJECT_ID");
  return builder.image(source);
}

// ── Types ──────────────────────────────────────────────────────────────

export interface SanityPhoto {
  _key: string;
  alt?: string;
  caption?: string;
  asset: {
    url: string;
    metadata: {
      lqip: string;
      dimensions: { width: number; height: number; aspectRatio: number };
    };
  };
}

export interface SanityCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  cover: SanityImageSource & {
    asset: {
      url: string;
      metadata: {
        lqip: string;
        dimensions: { width: number; height: number };
      };
    };
  };
  photos: SanityPhoto[];
}

export interface SanityRate {
  label: string;
  duration: string;
  price: string;
  sortOrder: number;
}

export interface SanityShootType {
  title: string;
  subtitle: string;
  features: string[];
  categorySlug?: string;
  sortOrder: number;
}

export interface SanitySiteSettings {
  contactEmail: string;
  footerHeadline: string;
  footerPitch: string;
  links: { platform: string; url: string }[];
}

// ── Queries ────────────────────────────────────────────────────────────

const CATEGORY_FIELDS = `
  name,
  "slug": slug.current,
  description,
  sortOrder,
  cover {
    ...,
    asset-> {
      url,
      metadata { lqip, dimensions { width, height } }
    }
  },
  photos[] {
    _key,
    alt,
    caption,
    asset-> {
      url,
      metadata { lqip, dimensions { width, height, aspectRatio } }
    }
  }
`;

function requireClient(): SanityClient {
  if (!client) throw new Error("Sanity not configured");
  return client;
}

export async function getCategories(): Promise<SanityCategory[]> {
  return requireClient().fetch(
    `*[_type == "category"] | order(sortOrder asc) { ${CATEGORY_FIELDS} }`
  );
}

export async function getCategoryBySlug(
  slug: string
): Promise<SanityCategory | null> {
  return requireClient().fetch(
    `*[_type == "category" && slug.current == $slug][0] { ${CATEGORY_FIELDS} }`,
    { slug }
  );
}

export async function getRates(): Promise<SanityRate[]> {
  return requireClient().fetch(
    `*[_type == "rate"] | order(sortOrder asc) { label, duration, price, sortOrder }`
  );
}

export async function getShootTypes(): Promise<SanityShootType[]> {
  return requireClient().fetch(
    `*[_type == "shootType"] | order(sortOrder asc) { title, subtitle, features, categorySlug, sortOrder }`
  );
}

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
  return requireClient().fetch(
    `*[_type == "siteSettings"][0] { contactEmail, footerHeadline, footerPitch, links }`
  );
}
