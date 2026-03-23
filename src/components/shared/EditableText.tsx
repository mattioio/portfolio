import { useRef, useEffect, useCallback, createElement, type CSSProperties } from 'react'

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

  // Set initial content and sync external changes (only when not focused)
  const setRef = useCallback((el: HTMLElement | null) => {
    (ref as React.MutableRefObject<HTMLElement | null>).current = el
    if (el && el.innerHTML !== value) {
      el.innerHTML = value
      lastValueRef.current = value
    }
  }, []) // intentionally no deps — only runs on mount

  useEffect(() => {
    // Sync prop → DOM only when the user isn't editing
    if (ref.current && !isFocusedRef.current && value !== lastValueRef.current) {
      ref.current.innerHTML = value
      lastValueRef.current = value
    }
  }, [value])

  if (!editable) {
    return createElement(as, {
      className,
      style,
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
    className: `${className} outline-none cursor-text`,
    style: { ...style, minWidth: '20px' },
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    onFocus: () => { isFocusedRef.current = true },
    onBlur: () => {
      isFocusedRef.current = false
      commitValue()
    },
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
            if (before.trim() === '-') {
              e.preventDefault()
              // Remove the "-" text
              node.textContent = text.slice(offset)
              // Place cursor at start
              const range = document.createRange()
              range.setStart(node, 0)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
              // Convert to bullet list
              document.execCommand('insertUnorderedList')
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

      // Stop arrow keys from navigating slides while editing
      e.stopPropagation()
    },
  })
}
