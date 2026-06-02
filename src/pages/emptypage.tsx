import { Layout } from '../components/Layout'
import { Home, BookOpen, BarChart3, RotateCcw, Bookmark, Settings } from 'lucide-react'

interface EmptyPageProps {
  title: string
  icon: any
}

export function EmptyPage({ title, icon: Icon }: EmptyPageProps) {
  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">功能开发中</h3>
          <p className="text-sm text-slate-400">该功能正在开发中，敬请期待！</p>
        </div>
      </div>
    </Layout>
  )
}
