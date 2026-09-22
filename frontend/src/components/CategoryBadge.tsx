export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  entertainment: { bg: "bg-cat-entertainment-bg", text: "text-cat-entertainment-text", dot: "bg-cat-entertainment-dot" },
  productivity:  { bg: "bg-cat-productivity-bg",  text: "text-cat-productivity-text",  dot: "bg-cat-productivity-dot" },
  fitness:       { bg: "bg-cat-fitness-bg",       text: "text-cat-fitness-text",       dot: "bg-cat-fitness-dot" },
  education:     { bg: "bg-cat-education-bg",     text: "text-cat-education-text",     dot: "bg-cat-education-dot" },
  finance:       { bg: "bg-cat-finance-bg",       text: "text-cat-finance-text",       dot: "bg-cat-finance-dot" },
  social:        { bg: "bg-cat-social-bg",        text: "text-cat-social-text",        dot: "bg-cat-social-dot" },
  utilities:     { bg: "bg-cat-utilities-bg",     text: "text-cat-utilities-text",     dot: "bg-cat-utilities-dot" },
  other:         { bg: "bg-cat-other-bg",         text: "text-cat-other-text",         dot: "bg-cat-other-dot" },
};

export function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

export default function CategoryBadge({ category }: { category: string }) {
  const colors = getCategoryColors(category);
  return (
    <span className={`ui-badge ${colors.bg} ${colors.text}`}>
      {category}
    </span>
  );
}
