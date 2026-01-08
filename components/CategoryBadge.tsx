type Category = 'breaking' | 'library' | 'sdk' | 'performance' | 'research' | 'security'

interface CategoryBadgeProps {
  category: Category
}

const categoryConfig: Record<Category, { label: string; color: string; emoji: string }> = {
  breaking: { label: 'Breaking', color: 'bg-red-500/10 text-red-400 border-red-500/20', emoji: '🔴' },
  library: { label: 'Library', color: 'bg-green-500/10 text-green-400 border-green-500/20', emoji: '🟢' },
  sdk: { label: 'SDK', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', emoji: '🔵' },
  performance: { label: 'Performance', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', emoji: '🟡' },
  research: { label: 'Research', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', emoji: '🟣' },
  security: { label: 'Security', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', emoji: '⚫' },
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}
