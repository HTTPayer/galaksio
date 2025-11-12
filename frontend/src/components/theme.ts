// Theme overrides for CDP provider. Use a loose record so we can pass
// arbitrary CSS variable keys without strict typing issues from the
// CDP theme type.
export const theme: Record<string, string> = {
  "colors-bg-default": "var(--cdp-example-card-bg-color)",
  "colors-fg-default": "var(--cdp-example-text-color)",
  "colors-primary": "var(--cdp-example-accent-color)",
};
