export interface NavLink {
  title: string;
  slug: string;
  isExternal?: boolean;
  items?: NavLink[];
}

export interface NavGroup {
  title: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export const ROUTES: NavGroup[] = [
      {
        title: "Projects",
        items: [
          {
            title: "My Portfolio",
            slug: "about-my-portfolio",
          },
          {
            title: "Sabermetric Seer",
            slug: "sabermetric-seer",
            items: [
              { title: "Game Center", slug: "sabermetric-seer/games" },
              { title: "League Leaders", slug: "sabermetric-seer/league-leaders" },
              { title: "Standings", slug: "sabermetric-seer/standings" },
              { title: "Transactions", slug: "sabermetric-seer/transactions" },
              {
                title: "Compare Players",
                slug: "sabermetric-seer/compare",
              },
            ],
          },
          {
            title: "Fantasy Football",
            slug: "fantasy-football",
            items: [
              { title: "League Members", slug: "fantasy-football" },
              {
                title: "Weekly Scores",
                slug: "fantasy-football/weekly-scores",
              },
            ],
          },
          {
            title: "March Madness",
            slug: "march-madness",
          },
          {
            title: "US Population Comparer",
            slug: "us-population-comparer",
          },
          {
            title: "Colorado Data",
            slug: "colorado-data",
            items: [
              { title: "Overview", slug: "colorado-data" },
              { title: "Denver Accidents", slug: "denver-accidents" },
              { title: "Cannabis Economy", slug: "colorado-data/cannabis-economy" },
              { title: "Crime in Colorado", slug: "colorado-data/crime" },
            ],
          },
        ],
      },
      {
        title: "Links",
        items: [
          {
            title: "GitHub",
            slug: "https://github.com/larsomic",
            isExternal: true
          },
          {
            title: "LinkedIn",
            slug: "https://www.linkedin.com/in/larson2/",
            isExternal: true
          },
          {
            title: "Contact Me!",
            slug: "contact-me",
          },
        ],
      },
];

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'items' in item;
}

export function getHref(link: NavLink): string {
  if (link.isExternal) return link.slug;
  return link.slug ? `/${link.slug}` : '/';
}

export function getAllLinks(routes: NavItem[]): NavLink[] {
  const links = routes.flatMap((item) => (isNavGroup(item) ? item.items : [item]));
  return links.flatMap((link) =>
    link.items ? [link, ...getAllLinks(link.items)] : [link],
  );
}

export function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getTitleForSlug(slug: string): string {
  const link = getAllLinks(ROUTES).find((l) => l.slug === slug);
  return link ? link.title : humanizeSlug(slug);
}