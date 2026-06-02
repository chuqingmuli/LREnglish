import { useSwipeable } from 'react-swipeable'
import type { Word } from '../../shared/types'
import { Volume2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface WordCardProps {
  word: Word
  showMeaning: boolean
  onShowMeaning?: () => void
  onKnown?: () => void
  onUnknown?: () => void
  swipeEnabled?: boolean
}

export function WordCard({
  word,
  showMeaning,
  onShowMeaning,
  onKnown,
  onUnknown,
  swipeEnabled = true,
}: WordCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, rotation: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handlers = useSwipeable({
    onSwipeStart: () => {
      setIsDragging(true)
    },
    onSwiping: (eventData) => {
      const { deltaX, deltaY, velocity, dir } = eventData
      const rotate = Math.min(Math.max(deltaX / 10, -20), 20)
      setPosition({
        x: deltaX,
        y: deltaY * 0.3,
        rotation: rotate
      })
    },
    onSwipedLeft: () => {
      if (position.x < -100) {
        onKnown?.()
      }
      setPosition({ x: 0, y: 0, rotation: 0 })
      setIsDragging(false)
    },
    onSwipedRight: () => {
      if (position.x > 100) {
        onUnknown?.()
      }
      setPosition({ x: 0, y: 0, rotation: 0 })
      setIsDragging(false)
    },
    onSwiped: () => {
      setPosition({ x: 0, y: 0, rotation: 0 })
      setIsDragging(false)
    },
    trackMouse: true,
    trackTouch: true,
    delta: 100,
  })

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      speechSynthesis.speak(utterance)
    }
  }

  const getSwipeColor = () => {
    if (position.x > 50) {
      return 'rgba(239, 68, 68, 0.8)'
    } else if (position.x < -50) {
      return 'rgba(34, 197, 94, 0.8)'
    }
    return 'transparent'
  }

  return (
    <div
      ref={cardRef}
      {...(swipeEnabled ? handlers : {})}
      className="max-w-md mx-auto cursor-pointer select-none relative"
      onClick={onShowMeaning}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      }}
    >
      <div
        className="absolute inset-0 rounded-3xl flex items-center justify-center z-20 pointer-events-none transition-opacity duration-200"
        style={{
          backgroundColor: getSwipeColor(),
          opacity: Math.abs(position.x) > 80 ? 0.95 : Math.abs(position.x) / 100,
        }}
      >
        <div className="text-white text-3xl font-black">
              {position.x < -80 ? '✓ 认识' : position.x > 80 ? '✕ 不认识' : ''}
            </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-5xl font-bold text-slate-800">{word.word}</h2>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSpeak()
              }}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
            >
              <Volume2 className="w-6 h-6 text-slate-600" />
            </button>
          </div>
          {word.phonetic && (
            <p className="text-2xl text-slate-500 mb-6">{word.phonetic}</p>
          )}

          {word.partOfSpeech && (
            <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-1.5 rounded-full text-base font-medium mb-4">
              {word.partOfSpeech}
            </span>
          )}

          {showMeaning && (
            <div className="mt-8 space-y-6 animate-fade-in">
              {word.meaningCn && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <p className="text-2xl text-slate-800 font-medium">{word.meaningCn}</p>
                </div>
              )}

              {word.meaningEn && (
              <div className="bg-slate-50 rounded-2xl p-6">
                  <p className="text-lg text-slate-600">{word.meaningEn}</p>
                </div>
              )}

              {word.example && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-l-4 border-yellow-400">
                  <p className="text-lg text-slate-700 italic">"{word.example}"</p>
                </div>
              )}
            </div>
          )}

          {!showMeaning && (
            <div className="mt-12">
              <p className="text-slate-400 text-lg">点击查看释义</p>
            </div>
          )}
        </div>
      </div>

      {!isDragging && Math.abs(position.x) < 50 && (
        <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-8 animate-bounce">
          <div className="text-slate-300 text-sm flex items-center gap-1">
            <span>←</span>
            <span>认识</span>
          </div>
          <div className="text-slate-300 text-sm flex items-center gap-1">
            <span>不认识</span>
            <span>→</span>
          </div>
        </div>
      )}
    </div>
  )
}
