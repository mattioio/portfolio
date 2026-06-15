import { useRef, useEffect, useCallback, createElement, type CSSProperties } from 'react'

// ── Hanging punctuation ──
// Pull a leading quote into the margin so the first letter aligns optically with
// the text below. CSS `hanging-punctuation` is Safari-only, so we use a negative
// text-indent sized to the glyph (works in Chrome/Firefox + the PDF export too).
const HANG_INDENT: Record<string, string> = {
  '"': '-0.46em', '“': '-0.46em', '”': '-0.46em', '«': '-0.46em', '„': '-0.46em',
  "'": '-0.24em', '‘': '-0.24em', '’': '-0.24em',
}
function hangingIndent(value: string, as: string, style?: CSSProperties): string | undefined {
  if (as === 'span' || as === 'a') return undefined // text-indent only affects block boxes
  const align = style?.textAlign
  if (align === 'center' || align === 'right') return undefined // hanging only makes sense left-aligned
  const first = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trimStart().charAt(0)
  return first ? HANG_INDENT[first] : undefined
}

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  as?: 'span' | 'p' | 'h1' | 'h2' | 'a' | 'div'
  className?: string
  style?: CSSProperties
  multiline?: boolean
  editable?: boolean
}

export function EditableText({
  value,
  onChange,
  as = 'span',
  className = '',
  style,
  multiline = false,
  editable = true,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null)
  const lastValueRef = useRef(value)
  const isFocusedRef = useRef(false)

  // Keep a ref to the latest value so the setRef callback always has it
  const valueRef = useRef(value)
  valueRef.current = value

  // Set content when the DOM element mounts (or remounts after mode switch)
  const setRef = useCallback((el: HTMLElement | null) => {
    (ref as React.MutableRefObject<HTMLElement | null>).current = el
    if (el) {
      // Always sync to the latest prop value when attaching to a new element
      el.innerHTML = valueRef.current
      lastValueRef.current = valueRef.current
    }
  }, [])

  useEffect(() => {
    // Sync prop → DOM only when the user isn't editing
    if (ref.current && !isFocusedRef.current && value !== lastValueRef.current) {
      ref.current.innerHTML = value
      lastValueRef.current = value
    }
  }, [value])

  const richClass = `rich-text${multiline ? ' rich-text-multi' : ''}`
  const hang = hangingIndent(value, as, style)
  const hangStyle: CSSProperties | undefined = hang ? { textIndent: hang } : undefined

  if (!editable) {
    return createElement(as, {
      className: `${className} ${richClass}`,
      style: hangStyle ? { ...style, ...hangStyle } : style,
      dangerouslySetInnerHTML: { __html: value },
    })
  }

  const commitValue = () => {
    if (ref.current) {
      const html = ref.current.innerHTML
      if (html !== lastValueRef.current) {
        lastValueRef.current = html
        onChange(html)
      }
    }
  }

  return createElement(as, {
    ref: setRef,
    className: `${className} outline-none cursor-text ${richClass}`,
    style: { ...style, ...hangStyle, minWidth: '20px' },
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onFocus: () => { isFocusedRef.current = true },
    onBlur: () => {
      isFocusedRef.current = false
      commitValue()
    },
    // Commit on input too, so formatting from the toolbar/shortcuts (and live
    // typing) persists immediately. Safe: the focused guard keeps React from
    // resetting the DOM/cursor while editing.
    onInput: commitValue,
    onKeyDown: (e: React.KeyboardEvent) => {
      // Auto-convert "- " into a bullet list: intercept Space after a lone "-" at line start
      if (multiline && e.key === ' ' && ref.current) {
        const sel = window.getSelection()
        if (sel && sel.isCollapsed && sel.rangeCount > 0) {
          const node = sel.anchorNode
          if (node && node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent ?? ''
            const offset = sel.anchorOffset
            // The text before cursor is exactly "-" (possibly with leading whitespace from a new line)
            const before = text.slice(0, offset)
            // "- " → bullet list, "1. " → numbered list
            const listCmd = before.trim() === '-' ? 'insertUnorderedList'
              : before.trim() === '1.' ? 'insertOrderedList'
              : null
            if (listCmd) {
              e.preventDefault()
              // Remove the marker text we just typed
              node.textContent = text.slice(offset)
              // Place cursor at start
              const range = document.createRange()
              range.setStart(node, 0)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
              document.execCommand(listCmd)
              commitValue()
              return
            }
          }
        }
      }
      const mod = e.metaKey || e.ctrlKey

      // Escape = blur / deselect
      if (e.key === 'Escape') {
        e.preventDefault()
        ref.current?.blur()
        return
      }

      // Shift+Enter = line break (always allowed)
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault()
        document.execCommand('insertLineBreak')
        return
      }

      // Plain Enter on single-line = blur
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault()
        ref.current?.blur()
        return
      }

      // Cmd+B = bold
      if (mod && e.key === 'b') {
        e.preventDefault()
        document.execCommand('bold')
        commitValue()
        return
      }

      // Cmd+I = italic
      if (mod && e.key === 'i') {
        e.preventDefault()
        document.execCommand('italic')
        commitValue()
        return
      }

      // Cmd+Shift+8 = bullet list
      if (mod && e.shiftKey && e.key === '8') {
        e.preventDefault()
        document.execCommand('insertUnorderedList')
        commitValue()
        return
      }

      // Cmd+Shift+7 = numbered list
      if (mod && e.shiftKey && e.key === '7') {
        e.preventDefault()
        document.execCommand('insertOrderedList')
        commitValue()
        return
      }

      // Stop arrow keys from navigating slides while editing
      e.stopPropagation()
    },
  })
}
