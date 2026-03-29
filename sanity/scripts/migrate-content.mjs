#!/usr/bin/env node
/**
 * Migrate existing static content → Sanity
 *
 * Usage:
 *   cd sanity
 *   SANITY_STUDIO_PROJECT_ID=xxx SANITY_TOKEN=xxx node scripts/migrate-content.mjs
 *
 * Get a write token from: https://www.sanity.io/manage → API → Tokens → Add API token (Editor)
 */

import { createClient } from "@sanity/client";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_TOKEN;

if (!projectId || !token) {
  console.error("❌ Set SANITY_STUDIO_PROJECT_ID and SANITY_TOKEN env vars");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

const ROOT = resolve(import.meta.dirname, "../..");
const IMAGES_DIR = join(ROOT, "public/images");

// ── Category data (mirrors src/data/categories.ts) ─────────────────────
const categories = [
  { name: "Music", slug: "music", folder: "Music", count: 14, description: "The energy, the crowd, the moment — live music photography", sortOrder: 1 },
  { name: "Portraits", slug: "portraits", folder: "Portraits", count: 10, description: "Authentic portraits that reveal character and emotion", sortOrder: 2 },
  { name: "Wedding", slug: "wedding", folder: "Wedding", count: 16, description: "Capturing love stories, from intimate ceremonies to grand celebrations", sortOrder: 3 },
  { name: "Food", slug: "food", folder: "Food", count: 16, description: "Editorial food and hospitality photography that tells a story", sortOrder: 4 },
  { name: "Sport", slug: "sport", folder: "Sport", count: 10, description: "Peak action and athletic moments frozen in time", sortOrder: 5 },
  { name: "Travel", slug: "travel", folder: "Travel", count: 16, description: "Landscapes, cultures, and stories from around the world", sortOrder: 6 },
];

// ── Rates ───────────────────────────────────────────────────────────────
const rates = [
  { label: "Half Day", duration: "up to 4 hrs", price: "From £350", sortOrder: 1 },
  { label: "Full Day", duration: "up to 10 hrs", price: "From £600", sortOrder: 2 },
  { label: "Multi-Day", duration: "2+ days", price: "From £500 / day", sortOrder: 3 },
];

// ── Shoot Types ─────────────────────────────────────────────────────────
const shootTypes = [
  {
    title: "Wedding", subtitle: "Intimate elopements to grand celebrations", categorySlug: "wedding", sortOrder: 1,
    features: ["Full day coverage (up to 10 hours)", "Second shooter available", "400+ edited images", "Highlight slideshow"],
  },
  {
    title: "Music & Events", subtitle: "Gigs, festivals, and everything in between", categorySlug: "music", sortOrder: 2,
    features: ["Live performance coverage", "Backstage & candid shots", "Artist portraits", "Fast turnaround for press"],
  },
  {
    title: "Food & Hospitality", subtitle: "Restaurants, bars, hotels, and brands", categorySlug: "food", sortOrder: 3,
    features: ["Menu & dish photography", "Interior & ambiance shots", "Social media ready crops", "Seasonal refresh packages"],
  },
  {
    title: "Sport", subtitle: "Grassroots to professional level", categorySlug: "sport", sortOrder: 4,
    features: ["Match & event coverage", "Athlete portraits", "Training & behind-the-scenes", "Season-long packages"],
  },
];

// ── Site Settings ───────────────────────────────────────────────────────
const siteSettings = {
  contactEmail: "hello@gavinbatty.com",
  footerHeadline: "Let's work together",
  footerPitch: "Have a project in mind? I'd love to hear about it. Every collaboration starts with a conversation.",
  links: [
    { _key: "ig", platform: "Instagram", url: "https://instagram.com/gavinbatty" },
    { _key: "li", platform: "LinkedIn", url: "https://linkedin.com/in/gavinbatty" },
    { _key: "tw", platform: "X", url: "https://twitter.com/gavinbatty" },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────

async function uploadImage(filePath) {
  const buf = await readFile(filePath);
  const filename = filePath.split("/").pop();
  console.log(`  📷 Uploading ${filename}…`);
  const asset = await client.assets.upload("image", buf, { filename });
  return { _type: "image", asset: { _type: "reference", _ref: asset._id } };
}

function makeId(prefix, slug) {
  return `${prefix}-${slug}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

// ── Migration ───────────────────────────────────────────────────────────

async function migrateCategories() {
  console.log("\n🗂️  Migrating categories…\n");

  for (const cat of categories) {
    const prefix = cat.folder === "Portraits" ? "portrait" : cat.slug;
    const dir = join(IMAGES_DIR, cat.folder);
    const docId = makeId("category", cat.slug);

    // Upload cover image (first image)
    const coverPath = join(dir, `${prefix}1.jpg`);
    const coverImage = await uploadImage(coverPath);

    // Upload all photos
    const photos = [];
    for (let i = 1; i <= cat.count; i++) {
      const imgPath = join(dir, `${prefix}${i}.jpg`);
      try {
        await stat(imgPath);
        const img = await uploadImage(imgPath);
        photos.push({
          _key: `photo-${i}`,
          _type: "image",
          alt: `${cat.name} photo ${i}`,
          asset: img.asset,
        });
      } catch {
        console.warn(`  ⚠️  Skipping missing: ${prefix}${i}.jpg`);
      }
    }

    const doc = {
      _id: docId,
      _type: "category",
      name: cat.name,
      slug: { _type: "slug", current: cat.slug },
      description: cat.description,
      sortOrder: cat.sortOrder,
      cover: coverImage,
      photos,
    };

    await client.createOrReplace(doc);
    console.log(`  ✅ ${cat.name} (${photos.length} photos)\n`);
  }
}

async function migrateRates() {
  console.log("\n💰 Migrating rates…\n");
  for (const rate of rates) {
    const doc = {
      _id: makeId("rate", rate.label),
      _type: "rate",
      ...rate,
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${rate.label}`);
  }
}

async function migrateShootTypes() {
  console.log("\n📸 Migrating shoot types…\n");
  for (const st of shootTypes) {
    const doc = {
      _id: makeId("shootType", st.title),
      _type: "shootType",
      ...st,
    };
    await client.createOrReplace(doc);
    console.log(`  ✅ ${st.title}`);
  }
}

async function migrateSiteSettings() {
  console.log("\n⚙️  Migrating site settings…\n");
  const doc = {
    _id: "siteSettings",
    _type: "siteSettings",
    ...siteSettings,
  };
  await client.createOrReplace(doc);
  console.log("  ✅ Site Settings");
}

// ── Run ─────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting content migration to Sanity…");
  console.log(`   Project: ${projectId} / ${dataset}\n`);

  await migrateSiteSettings();
  await migrateRates();
  await migrateShootTypes();
  await migrateCategories();

  console.log("\n✨ Migration complete!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
