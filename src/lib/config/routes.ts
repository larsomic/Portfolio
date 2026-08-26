export interface NavLink {
  title: string;
  slug: string;
  isExternal?: boolean;
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
          },
          {
            title: "Fantasy Football",
            slug: "fantasy-football",
          },
          {
            title: "March Madness",
            slug: "march-madness",
          },
        ],
      },
      {
        title: "Links",
        items: [
          {
            title: "GitHub",
            slug: "github",
            isExternal: true
          },
          {
            title: "LinkedIn",
            slug: "linkedin",
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
  return routes.flatMap((item) => (isNavGroup(item) ? item.items : [item]));
}