export interface Service {
  title: string;
  slug: string;
  includes: string[];
  note: string;
}

export const dayRate = {
  label: "Day Rate",
  price: "Get in Touch",
  note: "Half and full day options available. Every shoot includes a pre-shoot consultation, professional editing, and a curated digital gallery.",
};

export const services: Service[] = [
  {
    title: "Wedding",
    slug: "wedding",
    includes: [
      "Full day coverage (up to 10 hours)",
      "Second shooter available",
      "Curated gallery of 400+ edited images",
      "Highlight slideshow",
      "Engagement session add-on",
    ],
    note: "From intimate elopements to grand celebrations",
  },
  {
    title: "Music & Events",
    slug: "music",
    includes: [
      "Live performance coverage",
      "Backstage and candid shots",
      "Artist portraits",
      "Fast turnaround for press use",
      "Multi-day festival packages",
    ],
    note: "Gigs, festivals, and everything in between",
  },
  {
    title: "Food & Hospitality",
    slug: "food",
    includes: [
      "Menu and dish photography",
      "Interior and ambiance shots",
      "Staff and action photography",
      "Social media ready crops",
      "Seasonal refresh packages",
    ],
    note: "Restaurants, bars, hotels, and brands",
  },
  {
    title: "Sport",
    slug: "sport",
    includes: [
      "Match and event coverage",
      "Athlete portraits",
      "Training and behind-the-scenes",
      "Fast turnaround for media",
      "Season-long packages available",
    ],
    note: "From grassroots to professional level",
  },
];
