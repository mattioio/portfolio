import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

/**
 * Floating formatting toolbar for EditableText fields.
 * Mounted once at the app root. Appears when there's a text selection inside a
 * contentEditable `.rich-text` element, positioned just above the selection.
 * List buttons only show for multiline body fields (`.rich-text-multi`).
 *
 * Uses document.execCommand — deprecated but reliable in Chromium for
 * contentEditable rich-text. Buttons preventDefault on mousedown to keep the
 * selection/focus; execCommand fires an input event so EditableText commits.
 */

function findRichEditable(node: Node | null): HTMLElement | null {
  let el: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement ?? null
  while (el) {
    if (el.isContentEditable && el.classList.contains('rich-text')) return el
    el = el.parentElement
  }
  return null
}

export function RichTextToolbar() {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [showLists, setShowLists] = useState(true)
  const [active, setActive] = useState({ bold: false, italic: false, ul: false, ol: false })
  const barRef = useRef<HTMLDivElement>(null)

  const readActive = () => {
    try {
      setActive({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
      })
    } catch { /* queryCommandState can throw if no editable focused */ }
  }

  useEffect(() => {
    const update = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setPos(null); return }
      const editable = findRichEditable(sel.anchorNode)
      if (!editable) { setPos(null); return }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) { setPos(null); return }
      const top = Math.max(8, rect.top - 46)
      const left = Math.min(window.innerWidth - 90, Math.max(90, rect.left + rect.width / 2))
      setShowLists(editable.classList.contains('rich-text-multi'))
      setPos({ top, left })
      readActive()
    }
    document.addEventListener('selectionchange', update)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      document.removeEventListener('selectionchange', update)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (!pos) return null

  const run = (cmd: string) => (e: React.MouseEvent) => {
    e.preventDefault() // keep the selection + focus in the editable
    document.execCommand(cmd)
    readActive()
  }

  const Btn = ({ cmd, isActive, icon: Icon, label }: { cmd: string; isActive: boolean; icon: typeof Bold; label: string }) => (
    <button
      onMouseDown={run(cmd)}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        isActive ? 'bg-white text-zinc-900' : 'text-zinc-300 hover:bg-zinc-700'
      }`}
    >
      <Icon size={15} />
    </button>
  )

  return (
    <div
      ref={barRef}
      className="fixed z-[100] flex items-center gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
      onMouseDown={(e) => e.preventDefault()} // don't blur the editable when clicking chrome
    >
      <Btn cmd="bold" isActive={active.bold} icon={Bold} label="Bold (⌘B)" />
      <Btn cmd="italic" isActive={active.italic} icon={Italic} label="Italic (⌘I)" />
      {showLists && (
        <>
          <div className="mx-0.5 h-5 w-px bg-zinc-700" />
          <Btn cmd="insertUnorderedList" isActive={active.ul} icon={List} label="Bullet list (⌘⇧8)" />
          <Btn cmd="insertOrderedList" isActive={active.ol} icon={ListOrdered} label="Numbered list (⌘⇧7)" />
        </>
      )}
    </div>
  )
}
