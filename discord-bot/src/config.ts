// ── Brand Colors (as Discord integer format) ─────────────────────
export const COLORS = {
  GOLD: 0xd6b779,
  VIOLET: 0x8a4e64,
  TEAL: 0x4a8d83,
  WHITE: 0xffffff,
  GRAY: 0x808080,
} as const;

// ── Role Definitions ─────────────────────────────────────────────
export const ROLES = [
  { name: "Admin", color: COLORS.GOLD, permissions: [8n] /* Administrator */ },
  { name: "Moderator", color: COLORS.VIOLET, permissions: [8192n, 4194304n, 2n] /* ManageMessages, MuteMembers, KickMembers */ },
  { name: "Founding Builder", color: COLORS.TEAL, permissions: [] },
  { name: "Builder", color: COLORS.WHITE, permissions: [] },
] as const;

// ── Category & Channel Definitions ───────────────────────────────
export interface ChannelDef {
  name: string;
  topic?: string;
}

export interface CategoryDef {
  name: string;
  channels: ChannelDef[];
  visibleTo: "everyone" | "builders" | "admin";
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: "📋 ONBOARDING",
    visibleTo: "everyone",
    channels: [
      { name: "zasady", topic: "Przeczytaj regulamin i kliknij przycisk poniżej, aby dołączyć." },
      { name: "witaj", topic: "Powitania nowych członków społeczności." },
    ],
  },
  {
    name: "🇵🇱 POLSKA",
    visibleTo: "builders",
    channels: [
      { name: "pl-general", topic: "Luźne rozmowy po polsku" },
      { name: "pl-showcase", topic: "Pokaż co budujesz" },
      { name: "pl-help", topic: "Pytania, problemy, code review" },
      { name: "pl-resources", topic: "Linki, tutoriale, narzędzia" },
      { name: "pl-offtopic", topic: "Memy, random, luźne" },
    ],
  },
  {
    name: "🔧 ADMIN",
    visibleTo: "admin",
    channels: [
      { name: "admin-chat", topic: "Wewnętrzne rozmowy administracji" },
      { name: "admin-logs", topic: "Logi bota, dołączenia, wyjścia" },
    ],
  },
];

// ── Messages ─────────────────────────────────────────────────────
export const RULES_EMBED = {
  title: "Witaj w AI CORE!",
  description: [
    "Społeczność twórców budujących przy użyciu AI.",
    "",
    "**Zasady:**",
    "1. Szanuj innych — zero nienawiści, dram i toksyczności",
    "2. Pisz po polsku na odpowiednich kanałach",
    "3. Twórczość > autoreklama — pokazuj to, co budujesz, nie spamuj samymi linkami",
    "4. Pomagaj innym — każdy z nas kiedyś zaczynał",
    "5. Zakaz treści NSFW oraz tematów politycznych",
    "",
    "Kliknij przycisk poniżej, aby dołączyć.",
  ].join("\n"),
  color: COLORS.GOLD,
};

export const WELCOME_MESSAGE_TEMPLATE = (userId: string) =>
  `**Witaj <@${userId}>!** Jesteś teraz częścią AI CORE — społeczności twórców budujących z AI. Pokaż co tworzysz na kanale #pl-showcase lub poproś o pomoc na #pl-help. Budujmy razem!`;

export const ACCEPT_BUTTON = {
  customId: "accept-rules",
  label: "Akceptuję regulamin",
  style: 3, // ButtonStyle.Success
} as const;
