export interface CertTemplate {
  id: string;
  name: string;
  themes: string[];
  accent: string;
  bgGradient: string;
  pattern: "ornate" | "modern" | "tech" | "minimal" | "floral" | "wave" | "curve" | "geometric";
  description: string;
  variant?: "dark" | "light";
  textColor?: string;
  mutedColor?: string;
}

export const TEMPLATES: CertTemplate[] = [
  {
    id: "aurora",
    name: "Aurora",
    themes: ["Hackathon", "Coding Contest", "Tech"],
    accent: "#a855f7",
    bgGradient: "linear-gradient(135deg,#1a0b2e 0%,#2d1b4e 50%,#0f1642 100%)",
    pattern: "tech",
    description: "Cyberpunk-inspired with neon accents",
    variant: "dark",
  },
  {
    id: "regal",
    name: "Regal Gold",
    themes: ["Academic", "Formal", "Conference"],
    accent: "#e0b45c",
    bgGradient: "linear-gradient(135deg,#0f0f1e 0%,#1a1533 100%)",
    pattern: "ornate",
    description: "Classic ornate frame with gold foil",
    variant: "dark",
  },
  {
    id: "velocity",
    name: "Velocity",
    themes: ["Sports", "Athletics", "Fitness"],
    accent: "#f43f5e",
    bgGradient: "linear-gradient(135deg,#1a0a1a 0%,#3b0d2a 50%,#0d1a3b 100%)",
    pattern: "modern",
    description: "Dynamic diagonal lines and bold color",
    variant: "dark",
  },
  {
    id: "prism",
    name: "Prism",
    themes: ["Design", "Creative", "Art"],
    accent: "#38bdf8",
    bgGradient: "linear-gradient(135deg,#0b1a2e 0%,#1e0b3d 100%)",
    pattern: "modern",
    description: "Refracted light shapes and pastel gradients",
    variant: "dark",
  },
  {
    id: "monolith",
    name: "Monolith",
    themes: ["Business", "Corporate", "General"],
    accent: "#ffffff",
    bgGradient: "linear-gradient(135deg,#0a0a12 0%,#141422 100%)",
    pattern: "minimal",
    description: "Editorial minimal, typography-first",
    variant: "dark",
  },
  {
    id: "nebula",
    name: "Nebula",
    themes: ["Science", "Research", "Academic"],
    accent: "#c084fc",
    bgGradient: "linear-gradient(135deg,#160b3a 0%,#0b1533 50%,#3a0b2e 100%)",
    pattern: "modern",
    description: "Cosmic gradients with subtle starfield",
    variant: "dark",
  },
  // New light-variant templates
  {
    id: "floral",
    name: "Floral Appreciation",
    themes: ["Appreciation", "Community", "Volunteer", "General"],
    accent: "#b78324",
    bgGradient: "linear-gradient(135deg,#fbf6ec 0%,#f4ead6 100%)",
    pattern: "floral",
    description: "Cream canvas with soft floral corners and gold foil",
    variant: "light",
    textColor: "#3a2b13",
    mutedColor: "#7a6a4a",
  },
  {
    id: "azure-wave",
    name: "Azure Wave",
    themes: ["Completion", "Corporate", "Course", "Training"],
    accent: "#1e40af",
    bgGradient: "linear-gradient(135deg,#ffffff 0%,#f4f8ff 100%)",
    pattern: "wave",
    description: "Crisp white with a flowing blue wave signature",
    variant: "light",
    textColor: "#0b1a3b",
    mutedColor: "#4a5b7d",
  },
  {
    id: "meridian",
    name: "Meridian",
    themes: ["Achievement", "Internship", "Academic"],
    accent: "#d9a441",
    bgGradient: "linear-gradient(135deg,#fbf7ee 0%,#f2ead6 100%)",
    pattern: "geometric",
    description: "Navy + mustard geometric panels, editorial feel",
    variant: "light",
    textColor: "#0e1e3a",
    mutedColor: "#4a5060",
  },
  {
    id: "classic-gold",
    name: "Classic Gold",
    themes: ["Completion", "Formal", "Training", "Course"],
    accent: "#b78324",
    bgGradient: "linear-gradient(135deg,#ffffff 0%,#fbf6ea 100%)",
    pattern: "ornate",
    description: "Timeless double gold border, serif headline",
    variant: "light",
    textColor: "#1a1a1a",
    mutedColor: "#6b6b6b",
  },
  {
    id: "crimson-arc",
    name: "Crimson Arc",
    themes: ["Internship", "Program", "Corporate"],
    accent: "#b91c1c",
    bgGradient: "linear-gradient(135deg,#ffffff 0%,#fff4ec 100%)",
    pattern: "curve",
    description: "Cream body with a bold crimson arc footer",
    variant: "light",
    textColor: "#1a1a1a",
    mutedColor: "#6b6b6b",
  },
];

export const EVENT_THEMES = [
  "Hackathon",
  "Coding Contest",
  "Academic",
  "Sports",
  "Conference",
  "Design",
  "Creative",
  "Science",
  "Business",
  "General",
  "Appreciation",
  "Completion",
  "Corporate",
  "Internship",
  "Training",
  "Course",
];

export function templatesForTheme(theme: string): CertTemplate[] {
  const t = theme.toLowerCase();
  const matched = TEMPLATES.filter((tpl) =>
    tpl.themes.some((th) => th.toLowerCase() === t),
  );
  return matched.length ? [...matched, ...TEMPLATES.filter((x) => !matched.includes(x))] : TEMPLATES;
}
