import { useEffect } from 'react'
import { usePortfolioStore } from '../../store/portfolio-store'
import type { SlideType } from '../../store/types'
import {
  Layout,
  User,
  Heading1,
  Briefcase,
  Clock,
  FileText,
  LayoutGrid,
  Heart,
  X,
} from 'lucide-react'

interface AddSlideSheetProps {
  open: boolean
  onClose: () => void
}

interface TemplateOption {
  type: SlideType
  label: string
  icon: typeof Layout
  layoutVariant?: number
  shortcut: string // keyboard shortcut label
}

const templates: TemplateOption[] = [
  { type: 'hero', label: 'Hero', icon: Layout, shortcut: '1' },
  { type: 'about', label: 'About', icon: User, shortcut: '2' },
  { type: 'section-title', label: 'Section Title', icon: Heading1, shortcut: '3' },
  { type: 'cv', label: 'Places Worked', icon: Briefcase, shortcut: '4' },
  { type: 'work-history', label: 'Work History', icon: Clock, shortcut: '5' },
  { type: 'case-study', label: 'Case Study', icon: FileText, shortcut: '6' },
  { type: 'bento', label: 'Bento 1', icon: LayoutGrid, layoutVariant: 1, shortcut: '7' },
  { type: 'bento', label: 'Bento 2', icon: LayoutGrid, layoutVariant: 2, shortcut: '8' },
  { type: 'bento', label: 'Bento 3', icon: LayoutGrid, layoutVariant: 3, shortcut: '9' },
  { type: 'bento', label: 'Bento 4', icon: LayoutGrid, layoutVariant: 4, shortcut: '0' },
  { type: 'bento', label: 'Bento 5', icon: LayoutGrid, layoutVariant: 5, shortcut: '-' },
  { type: 'sign-off', label: 'Sign Off', icon: Heart, shortcut: '=' },
]

export function AddSlideSheet({ open, onClose }: AddSlideSheetProps) {
  const addSlide = usePortfolioStore((s) => s.addSlide)

  const handleAdd = (t: TemplateOption) => {
    addSlide(t.type, { layoutVariant: t.layoutVariant })
    onClose()
  }

  // Keyboard shortcuts when sheet is open
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // Escape closes
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }

      // Number/key selects template
      const match = templates.find((t) => t.shortcut === e.key)
      if (match) {
        e.preventDefault()
        handleAdd(match)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 z-50 w-64 rounded-t-2xl border-t border-zinc-700 bg-zinc-900 p-4 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Add slide
          </p>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {templates.map((t, i) => (
            <button
              key={`${t.type}-${t.layoutVariant ?? i}`}
              onClick={() => handleAdd(t)}
              className="group flex items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-2 text-left text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              <t.icon size={13} />
              <span className="flex-1">{t.label}</span>
              <kbd className="text-[10px] text-zinc-600 group-hover:text-zinc-500">{t.shortcut}</kbd>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
