// src/components/editor/MenpanRichTextEditor.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  RemoveFormatting
} from 'lucide-react'

export interface MenpanRichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  className?: string
}

function sanitizeEditorContent(html?: string | null): string {
  if (!html) return ''
  let s = html.trim()
  if (s === '<p></p>' || s === '<p><br></p>' || s === '<p><br/></p>') {
    return ''
  }
  // Hapus seluruh paragraf kosong di paling awal agar tidak membuat enter/break kosong di atas
  while (/^<p>\s*(<br\s*\/?>)?\s*<\/p>/i.test(s)) {
    s = s.replace(/^<p>\s*(<br\s*\/?>)?\s*<\/p>/i, '').trim()
  }
  return s
}

export function MenpanRichTextEditor({
  value,
  onChange,
  placeholder = 'Tuliskan catatan atau rekomendasi di sini...',
  minHeight = '90px',
  disabled = false,
  className = ''
}: MenpanRichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const initialContent = sanitizeEditorContent(value)

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside space-y-0.5 my-1 pl-1'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside space-y-0.5 my-1 pl-1'
          }
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-relaxed'
          }
        },
        paragraph: {
          HTMLAttributes: {
            class: 'mb-1 last:mb-0 leading-relaxed'
          }
        }
      }),
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-ink-muted/60 before:float-left before:pointer-events-none before:h-0'
      })
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Jika hanya menyisakan tag kosong <p></p>, jadikan string kosong
      if (html === '<p></p>' || html === '<p></p><p></p>' || html === '<p><br></p>') {
        onChange('')
      } else {
        onChange(html)
      }
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none p-3 text-xs leading-relaxed text-ink prose prose-sm max-w-none dark:prose-invert select-text [&_p:first-child]:mt-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1`
      }
    }
  })

  // Sinkronisasi value saat berubah dari luar (misal tombol AI atau ubah dropdown)
  useEffect(() => {
    if (!editor || value === undefined) return
    const currentHtml = editor.getHTML()
    const cleanCurrent = sanitizeEditorContent(currentHtml)
    const cleanValue = sanitizeEditorContent(value)

    const stripTags = (s: string) =>
      s.replace(/<\/p>\s*<p>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

    // Hanya lakukan setContent jika isi teks bersihnya benar-benar berbeda dari luar
    if (cleanCurrent !== cleanValue && stripTags(cleanCurrent) !== stripTags(cleanValue)) {
      editor.commands.setContent(cleanValue || '')
    }
  }, [value, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  if (!mounted) {
    return (
      <div
        style={{ minHeight }}
        className="w-full rounded-xl border border-stroke/70 bg-surface p-3 text-xs text-ink-muted"
      >
        Memuat editor...
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border border-stroke/70 bg-surface overflow-hidden shadow-2xs transition-colors focus-within:border-brand focus-within:ring-1 focus-within:ring-brand ${className}`}
    >
      {/* Mini MenPAN Toolbar */}
      <div className="flex items-center gap-0.5 p-1 bg-surface-subtle/60 border-b border-stroke/40 flex-wrap">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor || disabled}
          title="Tebal (Bold)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('bold') ? 'bg-surface-elevated text-brand font-bold shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor || disabled}
          title="Miring (Italic)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('italic') ? 'bg-surface-elevated text-brand shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={!editor || disabled}
          title="Garis Bawah (Underline)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('underline') ? 'bg-surface-elevated text-brand shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={!editor || disabled}
          title="Coret (Strikethrough)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('strike') ? 'bg-surface-elevated text-brand shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stroke/60 mx-1 self-center" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor || disabled}
          title="Daftar Poin (Bullet List)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('bulletList') ? 'bg-surface-elevated text-brand font-bold shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor || disabled}
          title="Daftar Bernomor (Numbered List)"
          className={`p-1.5 rounded-md text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ${
            editor?.isActive('orderedList') ? 'bg-surface-elevated text-brand font-bold shadow-2xs' : 'text-ink-secondary'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={!editor || disabled}
          title="Hapus Format Teks"
          className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 ml-auto"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor || !editor.can().undo() || disabled}
          title="Urungkan (Undo)"
          className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-20"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor || !editor.can().redo() || disabled}
          title="Ulangi (Redo)"
          className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-20"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div style={{ minHeight }} className="cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
