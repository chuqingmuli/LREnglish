import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { WordBookDetail } from "./pages/WordBookDetail";
import { Study } from "./pages/Study";
import { Screen } from "./pages/Screen";
import { Login } from "./pages/Login";
import { EmptyPage } from "./pages/EmptyPage";
import { Home as HomeIcon, BookOpen, BarChart3, RotateCcw, Bookmark, Settings, Plus } from 'lucide-react'
import { useAppStore } from "./store";
import { WordBookCard } from "./components/WordBookCard";
import { Empty } from "./components/Empty";
import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";

function WordBooksPage() {
  const navigate = useNavigate()
  const { wordbooks, loading, error, fetchWordbooks, createWordbook, deleteWordbook } = useAppStore()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreateWordbook = async () => {
    if (!newName.trim()) return
    await createWordbook(newName.trim(), newDescription.trim())
    setShowNewModal(false)
    setNewName('')
    setNewDescription('')
  }

  const customWordbooks = wordbooks.filter(w => w.type === 'custom')
  const builtinWordbooks = wordbooks.filter(w => w.type === 'built-in' || w.type === 'system')

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">词书管理</h2>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建词书
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 rounded-lg text-xs text-red-600">{error}</div>
        )}

        {!loading && wordbooks.length === 0 && (
          <Empty
            title="还没有词书"
            description="创建你的第一个词书开始学习"
            action={{ label: '新建词书', onClick: () => setShowNewModal(true), icon: 'plus' }}
          />
        )}

        {builtinWordbooks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">内置词书</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {builtinWordbooks.map(wb => (
                <WordBookCard
                  key={wb.id}
                  wordbook={wb}
                  onClick={() => navigate(`/wordbook/${wb.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {customWordbooks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-3">我的词书</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {customWordbooks.map(wb => (
                <WordBookCard
                  key={wb.id}
                  wordbook={wb}
                  onClick={() => navigate(`/wordbook/${wb.id}`)}
                  onDelete={() => deleteWordbook(wb.id)}
                />
              ))}
            </div>
          </div>
        )}

        {showNewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-800 mb-4">新建词书</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">词书名称</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入词书名称"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">描述（可选）</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="输入词书描述"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateWordbook}
                  disabled={!newName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wordbooks" element={<WordBooksPage />} />
        <Route path="/wordbook/:id" element={<WordBookDetail />} />
        <Route path="/screen/:id" element={<Screen />} />
        <Route path="/study/:id" element={<Study />} />
        <Route path="/stats" element={<EmptyPage title="学习统计" icon={BarChart3} />} />
        <Route path="/review" element={<EmptyPage title="复习记录" icon={RotateCcw} />} />
        <Route path="/words" element={<EmptyPage title="生词本" icon={Bookmark} />} />
        <Route path="/settings" element={<EmptyPage title="设置" icon={Settings} />} />
      </Routes>
    </Router>
  );
}
