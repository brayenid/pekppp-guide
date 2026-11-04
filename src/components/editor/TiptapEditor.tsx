// src/components/editor/TiptapEditor.tsx
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  Trash2,
  Plus
} from 'lucide-react'
import { MediaPickerModal } from '../media/MediaPickerModal'
import { MediaAssetItem } from '../../actions/media-actions'

export interface TiptapEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Mulai tulis konten artikel, panduan, atau berita di sini...',
  minHeight = '360px'
}: TiptapEditorProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4]
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand underline hover:text-brand-hover font-medium',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-line shadow-xs mx-auto object-cover'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'w-full border-collapse my-4 border border-line text-sm rounded-lg overflow-hidden'
        }
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-line hover:bg-surface-subtle/50 transition-colors'
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-line bg-surface-subtle px-3 py-2 text-left font-semibold text-ink text-xs uppercase tracking-wider'
        }
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-line px-3 py-2 text-ink text-xs sm:text-sm'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'focus:outline-none min-h-[300px] px-5 py-4 text-ink leading-relaxed prose prose-sm sm:prose-base dark:prose-invert max-w-none tiptap'
      }
    }
  })

  // Sinkronisasi value jika berubah dari luar dan editor belum sinkron
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      if (editor.getText() === '' && value === '') return
      // Hanya update jika perbedaannya signifikan untuk mencegah kursor lompat
      const currentHtml = editor.getHTML()
      if (currentHtml !== value && (currentHtml === '<p></p>' || value === '')) {
        editor.commands.setContent(value || '')
      }
    }
  }, [value, editor])

  // Callback saat gambar dipilih dari MediaPickerModal
  const handleSelectMedia = useCallback(
    (asset: MediaAssetItem) => {
      if (!editor) return
      // Tentukan URL gambar
      const imgUrl = asset.fileUrl.startsWith('http') || asset.fileUrl.startsWith('/')
        ? asset.fileUrl
        : `/api/media/${asset.id}/preview`

      editor
        .chain()
        .focus()
        .setImage({
          src: imgUrl,
          alt: asset.title || asset.fileName,
          title: asset.title || asset.fileName
        })
        .run()

      setIsMediaPickerOpen(false)
    },
    [editor]
  )

  // Toggle hyperlink
  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Masukkan tautan URL (contoh: https://...):', previousUrl)

    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }, [editor])

  if (!mounted || !editor) {
    return (
      <div
        className="w-full rounded-2xl border border-line bg-surface flex items-center justify-center text-xs text-ink-muted animate-pulse"
        style={{ minHeight }}>
        Menyiapkan editor WYSIWYG...
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-line bg-surface shadow-xs overflow-hidden flex flex-col focus-within:border-brand transition-colors">
      {/* ── Toolbar Bar ── */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-subtle/50 border-b border-line text-ink">
        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Urungkan (Undo)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Ulangi (Redo)">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Heading 2 (Sub-judul Besar)">
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Heading 3 (Sub-judul Kecil)">
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Inline Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bold')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Tebal (Bold)">
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('italic')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Miring (Italic)">
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('underline')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Garis Bawah (Underline)">
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('strike')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Coret (Strikethrough)">
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Rata Kiri">
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Rata Tengah">
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Rata Kanan">
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive({ textAlign: 'justify' })
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Rata Kiri-Kanan (Justify)">
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Daftar Poin (Bullet List)">
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Daftar Nomor (Numbered List)">
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Kutipan / Maklumat (Blockquote)">
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface transition-colors"
          title="Garis Pemisah (Divider)">
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('link')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Tautan / Link">
          <LinkIcon className="w-4 h-4" />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Hapus Link">
            <Unlink className="w-4 h-4" />
          </button>
        )}

        <div className="w-px h-5 bg-line mx-1" />

        {/* Table Management */}
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={`p-1.5 rounded-lg transition-colors ${
            editor.isActive('table')
              ? 'bg-brand text-white'
              : 'text-ink-secondary hover:text-ink hover:bg-surface'
          }`}
          title="Sisipkan Tabel 3x3">
          <TableIcon className="w-4 h-4" />
        </button>

        {editor.isActive('table') && (
          <div className="flex items-center gap-1 bg-surface px-1.5 py-0.5 rounded-lg border border-line">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle hover:bg-surface text-ink font-mono"
              title="Tambah Baris Bawah">
              +Baris
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle hover:bg-surface text-ink font-mono"
              title="Tambah Kolom Kanan">
              +Kolom
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-rose-500/10 text-rose-600 font-mono"
              title="Hapus Baris">
              -Baris
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="text-[10px] px-1.5 py-0.5 rounded hover:bg-rose-500/10 text-rose-600 font-mono"
              title="Hapus Kolom">
              -Kolom
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="p-1 rounded text-rose-500 hover:bg-rose-500/10"
              title="Hapus Seluruh Tabel">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── IMAGE INTEGRATION (Media Manager Picker) ── */}
        <button
          type="button"
          onClick={() => setIsMediaPickerOpen(true)}
          className="p-1.5 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface transition-colors"
          title="Sisipkan Gambar (Pustaka Media / Upload)">
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* ── Editor Body ── */}
      <div className="flex-1 bg-surface" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      {/* ── Word & Character Count Bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-line bg-surface-subtle/30 text-[11px] text-ink-muted">
        <div>
          Estimasi baca:{' '}
          <span className="font-semibold text-ink">
            {Math.max(
              1,
              Math.ceil(
                (editor.getText().trim().split(/\s+/).filter(Boolean).length || 0) / 200
              )
            )}{' '}
            menit
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            {editor.getText().trim().split(/\s+/).filter(Boolean).length} kata
          </span>
          <span>•</span>
          <span>{editor.getText().length} karakter</span>
        </div>
      </div>

      {/* ── Modal Media Picker ── */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleSelectMedia}
        title="Pilih atau Unggah Foto untuk Artikel"
        description="Ambil foto dari Pustaka Media atau unggah foto dokumentasi kegiatan baru secara langsung."
        allowedFileTypes={['IMAGE']}
      />
    </div>
  )
}
