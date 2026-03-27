export interface Category {
  name: string;
  slug: string;
  folder: string;
  cover: string;
  count: number;
  description: string;
}

export const categories: Category[] = [
  {
    name: "Music",
    slug: "music",
    folder: "Music",
    cover: "/images/Music/music1.jpg",
    count: 14,
    description: "The energy, the crowd, the moment — live music photography",
  },
  {
    name: "Portraits",
    slug: "portraits",
    folder: "Portraits",
    cover: "/images/Portraits/portrait1.jpg",
    count: 10,
    description: "Authentic portraits that reveal character and emotion",
  },
  {
    name: "Wedding",
    slug: "wedding",
    folder: "Wedding",
    cover: "/images/Wedding/wedding3.jpg",
    count: 16,
    description: "Capturing love stories, from intimate ceremonies to grand celebrations",
  },
  {
    name: "Food",
    slug: "food",
    folder: "Food",
    cover: "/images/Food/food1.jpg",
    count: 16,
    description: "Editorial food and hospitality photography that tells a story",
  },
  {
    name: "Sport",
    slug: "sport",
    folder: "Sport",
    cover: "/images/Sport/sport1.jpg",
    count: 10,
    description: "Peak action and athletic moments frozen in time",
  },
  {
    name: "Travel",
    slug: "travel",
    folder: "Travel",
    cover: "/images/Travel/travel1.jpg",
    count: 16,
    description: "Landscapes, cultures, and stories from around the world",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getImagesForCategory(category: Category): string[] {
  const images: string[] = [];
  for (let i = 1; i <= category.count; i++) {
    const prefix = category.folder === "Portraits" ? "portrait" : category.slug;
    images.push(`/images/${category.folder}/${prefix}${i}.jpg`);
  }
  return images;
}
