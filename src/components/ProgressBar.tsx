interface ProgressBarProps {
  progress: number
  total: number
  className?: string
}

export function ProgressBar({ progress, total, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? (progress / total) * 100 : 0

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  )
}
