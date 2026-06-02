import { BookOpen, Trash2 } from 'lucide-react'
import type { WordBook } from '../../shared/types'

interface WordBookCardProps {
  wordbook: WordBook
  onClick: () => void
  onDelete?: () => void
}

export function WordBookCard({ wordbook, onClick, onDelete }: WordBookCardProps) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-100 p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{wordbook.name}</h4>
          <p className="text-xs text-slate-400 mt-1">{wordbook.wordCount || 0} 个单词</p>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('确定要删除这个词书吗？')) {
                  onDelete()
                }
              }}
              className="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              删除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
