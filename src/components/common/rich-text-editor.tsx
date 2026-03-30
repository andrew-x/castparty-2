"use client"

import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon } from "lucide-react"
import { useEffect } from "react"
import { cn } from "@/lib/util"

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  id?: string
  "aria-invalid"?: boolean
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  id,
  "aria-invalid": ariaInvalid,
  className,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      const html = editor.getHTML()
      // Tiptap produces <p></p> for empty content — normalize to empty string
      onChange(html === "<p></p>" ? "" : html)
    },
  })

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    const normalizedCurrent = currentHtml === "<p></p>" ? "" : currentHtml
    if (normalizedCurrent !== value) {
      editor.commands.setContent(value || "")
    }
  }, [editor, value])

  if (!editor) return null

  const toggleButtons = [
    {
      label: "Bold",
      icon: BoldIcon,
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: ItalicIcon,
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Bullet list",
      icon: ListIcon,
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered list",
      icon: ListOrderedIcon,
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ]

  return (
    <div
      id={id}
      aria-invalid={ariaInvalid}
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
    >
      <div className="flex gap-0.5 border-input border-b px-2 py-1.5">
        {toggleButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            aria-label={btn.label}
            aria-pressed={btn.active}
            className={cn(
              "flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              btn.active && "bg-muted text-foreground",
            )}
          >
            <btn.icon className="size-4" />
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="prose-description min-h-32 px-3 py-2 text-base md:text-sm [&_.tiptap.ProseMirror]:outline-none [&_.tiptap.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.tiptap.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
