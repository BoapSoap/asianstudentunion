export type SocialLink = {
  id: string;
  label: string;
  url: string;
  icon_url: string | null;
  sort_order: number | null;
  is_active?: boolean;
};

export type SocialLinksResponse = {
  links?: SocialLink[];
  error?: string;
};

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: "default-instagram",
    label: "Instagram",
    url: "https://www.instagram.com/asianstudentunion/",
    icon_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: "default-tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com/@sfsuasianstudentunion",
    icon_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: "default-discord",
    label: "Discord",
    url: "https://discord.com/invite/m485CGmEWr",
    icon_url: null,
    sort_order: 3,
    is_active: true,
  },
];
