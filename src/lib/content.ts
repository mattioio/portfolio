/**
 * Content layer — fetches from Sanity CMS when configured,
 * falls back to static data files during development or migration.
 */
import {
  getCategories as sanityGetCategories,
  getCategoryBySlug as sanityGetCategoryBySlug,
  getRates as sanityGetRates,
  getShootTypes as sanityGetShootTypes,
  getSiteSettings as sanityGetSiteSettings,
  type SanityCategory,
  type SanityRate,
  type SanityShootType,
  type SanitySiteSettings,
} from "./sanity";

import {
  categories as staticCategories,
  getImagesForCategory,
} from "../data/categories";
import { CONTACT_EMAIL } from "../data/contact";

const hasSanity = !!import.meta.env.PUBLIC_SANITY_PROJECT_ID &&
  import.meta.env.PUBLIC_SANITY_PROJECT_ID !== "your-project-id";

// ── Types re-exported for consumers ─────────────────────────────────────

export interface ContentCategory {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  /** Cover image URL (Sanity CDN or local /images/) */
  cover: string;
  /** Cover LQIP base64 — only from Sanity */
  coverLqip?: string;
  coverWidth?: number;
  coverHeight?: number;
  photos: ContentPhoto[];
}

export interface ContentPhoto {
  key: string;
  src: string;
  alt?: string;
  caption?: string;
  lqip?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface ContentRate {
  label: string;
  duration: string;
  price: string;
  sortOrder: number;
}

export interface ContentShootType {
  title: string;
  subtitle: string;
  features: string[];
  categorySlug?: string;
  sortOrder: number;
}

export interface ContentSiteSettings {
  contactEmail: string;
  footerHeadline: string;
  footerPitch: string;
  links: { platform: string; url: string }[];
}

// ── Adapters (Sanity → Content) ─────────────────────────────────────────

function adaptCategory(sc: SanityCategory): ContentCategory {
  return {
    name: sc.name,
    slug: sc.slug,
    description: sc.description,
    sortOrder: sc.sortOrder,
    cover: sc.cover?.asset?.url ?? "",
    coverLqip: sc.cover?.asset?.metadata?.lqip,
    coverWidth: sc.cover?.asset?.metadata?.dimensions?.width,
    coverHeight: sc.cover?.asset?.metadata?.dimensions?.height,
    photos: (sc.photos ?? []).map((p, i) => ({
      key: p._key ?? `photo-${i}`,
      src: p.asset?.url ?? "",
      alt: p.alt,
      caption: p.caption,
      lqip: p.asset?.metadata?.lqip,
      width: p.asset?.metadata?.dimensions?.width,
      height: p.asset?.metadata?.dimensions?.height,
      aspectRatio: p.asset?.metadata?.dimensions?.aspectRatio,
    })),
  };
}

function adaptStaticCategory(sc: typeof staticCategories[number]): ContentCategory {
  const images = getImagesForCategory(sc);
  return {
    name: sc.name,
    slug: sc.slug,
    description: sc.description,
    sortOrder: 0,
    cover: sc.cover,
    photos: images.map((src, i) => ({
      key: `photo-${i}`,
      src,
      alt: `${sc.name} photo ${i + 1}`,
    })),
  };
}

// ── Public API ──────────────────────────────────────────────────────────

export async function getCategories(): Promise<ContentCategory[]> {
  if (hasSanity) {
    try {
      const cats = await sanityGetCategories();
      if (cats.length > 0) return cats.map(adaptCategory);
    } catch (e) {
      console.warn("[content] Sanity fetch failed, using static data:", e);
    }
  }
  return staticCategories.map(adaptStaticCategory);
}

export async function getCategoryBySlug(slug: string): Promise<ContentCategory | null> {
  if (hasSanity) {
    try {
      const cat = await sanityGetCategoryBySlug(slug);
      if (cat) return adaptCategory(cat);
    } catch (e) {
      console.warn("[content] Sanity fetch failed, using static data:", e);
    }
  }
  const sc = staticCategories.find((c) => c.slug === slug);
  return sc ? adaptStaticCategory(sc) : null;
}

export async function getRates(): Promise<ContentRate[]> {
  if (hasSanity) {
    try {
      const rates = await sanityGetRates();
      if (rates.length > 0) return rates;
    } catch (e) {
      console.warn("[content] Sanity rates fetch failed, using static data:", e);
    }
  }
  // Static fallback
  return [
    { label: "Half Day", duration: "up to 4 hrs", price: "From £350", sortOrder: 1 },
    { label: "Full Day", duration: "up to 10 hrs", price: "From £600", sortOrder: 2 },
    { label: "Multi-Day", duration: "2+ days", price: "From £500 / day", sortOrder: 3 },
  ];
}

export async function getShootTypes(): Promise<ContentShootType[]> {
  if (hasSanity) {
    try {
      const types = await sanityGetShootTypes();
      if (types.length > 0) return types;
    } catch (e) {
      console.warn("[content] Sanity shoot types fetch failed, using static data:", e);
    }
  }
  return [
    { title: "Wedding", subtitle: "Intimate elopements to grand celebrations", features: ["Full day coverage (up to 10 hours)", "Second shooter available", "400+ edited images", "Highlight slideshow"], categorySlug: "wedding", sortOrder: 1 },
    { title: "Music & Events", subtitle: "Gigs, festivals, and everything in between", features: ["Live performance coverage", "Backstage & candid shots", "Artist portraits", "Fast turnaround for press"], categorySlug: "music", sortOrder: 2 },
    { title: "Food & Hospitality", subtitle: "Restaurants, bars, hotels, and brands", features: ["Menu & dish photography", "Interior & ambiance shots", "Social media ready crops", "Seasonal refresh packages"], categorySlug: "food", sortOrder: 3 },
    { title: "Sport", subtitle: "Grassroots to professional level", features: ["Match & event coverage", "Athlete portraits", "Training & behind-the-scenes", "Season-long packages"], categorySlug: "sport", sortOrder: 4 },
  ];
}

export async function getSiteSettings(): Promise<ContentSiteSettings> {
  if (hasSanity) {
    try {
      const settings = await sanityGetSiteSettings();
      if (settings) return settings;
    } catch (e) {
      console.warn("[content] Sanity settings fetch failed, using static data:", e);
    }
  }
  return {
    contactEmail: CONTACT_EMAIL,
    footerHeadline: "Let's work together",
    footerPitch: "Have a project in mind? I'd love to hear about it. Every collaboration starts with a conversation.",
    links: [
      { platform: "Instagram", url: "https://instagram.com/gavinbatty" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/gavinbatty" },
      { platform: "X", url: "https://twitter.com/gavinbatty" },
    ],
  };
}
