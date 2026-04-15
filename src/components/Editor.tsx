"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { VideoNode } from "@/lib/video-extension";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Minus,
  Save,
  ImagePlus,
  Video,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

type EditorProps = {
  content: string;
  onSave: (content: string) => Promise<void>;
  readOnly?: boolean;
};

export default function Editor({ content, onSave, readOnly = false }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const latestContent = useRef(content);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const doSave = useCallback(
    async (json: string) => {
      setSaveStatus("saving");
      try {
        await onSave(json);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [onSave]
  );

  const manualSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    doSave(latestContent.current);
  }, [doSave]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Image.configure({
        HTMLAttributes: { class: "editor-image" },
        allowBase64: true,
      }),
      VideoNode,
    ],
    content: content ? JSON.parse(content) : undefined,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      setSaveStatus("unsaved");
      const json = JSON.stringify(editor.getJSON());
      latestContent.current = json;

      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => doSave(json), 1500);
    },
    editorProps: {
      attributes: {
        class: "tiptap prose max-w-none focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        manualSave();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [manualSave]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Video must be under 25MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor
        .chain()
        .focus()
        .insertContent({
          type: "video",
          attrs: { src, title: file.name },
        })
        .run();
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  if (!editor) {
    return <div className="animate-pulse bg-muted rounded-lg h-96" />;
  }

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="sticky top-14 z-10 bg-background border-b border-border px-3 py-2 flex items-center gap-1 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <ToolbarButton
            onClick={() => imageInputRef.current?.click()}
            title="Insert Image (PNG, JPG, GIF, WebP — max 5MB)"
          >
            <ImagePlus className="w-4 h-4" />
          </ToolbarButton>

          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={handleVideoUpload}
            className="hidden"
          />
          <ToolbarButton
            onClick={() => videoInputRef.current?.click()}
            title="Insert Video (MP4, WebM, OGG — max 25MB)"
          >
            <Video className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>

          <Separator />

          <ToolbarButton
            onClick={manualSave}
            title="Save now (Ctrl+S)"
            active={saveStatus === "saving"}
          >
            <Save className="w-4 h-4" />
          </ToolbarButton>

          <div className="ml-auto flex items-center gap-1.5 text-xs">
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1 text-muted-fg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="inline-flex items-center gap-1 text-amber-500">
                <AlertCircle className="w-3.5 h-3.5" />
                Unsaved
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 bg-background">
        <div className="max-w-3xl mx-auto py-8 px-4">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors cursor-pointer",
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted text-foreground",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
