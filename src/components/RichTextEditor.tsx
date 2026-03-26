import React, { useCallback, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize, LineHeight, ParagraphSpacing } from '../lib/tiptap-extensions';
import { loadCustomFonts, CustomFont } from '../lib/fonts';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Palette, Type as TypeIcon,
  MoveVertical, ArrowUpDown
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const FontSizeSelector = ({ editor }: { editor: any }) => {
  const currentFontSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') || '';
  const [inputValue, setInputValue] = useState(currentFontSize);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setInputValue(currentFontSize);
    }
  }, [currentFontSize, isOpen]);

  const applyFontSize = useCallback((val: string) => {
    if (val) {
      const size = /^\d+$/.test(val) ? `${val}px` : val;
      editor.chain().focus().setFontSize(size).run();
    } else {
      editor.chain().focus().unsetFontSize().run();
    }
    setIsOpen(false);
  }, [editor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isOpen) {
          applyFontSize(inputValue);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, inputValue, applyFontSize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFontSize(inputValue);
    }
  };

  const fontSizes = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72"];

  return (
    <div className="relative flex items-center" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder="Cỡ chữ"
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500 w-16 text-center"
      />
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-16 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          {fontSizes.map(size => (
            <button
              key={size}
              type="button"
              className="block w-full text-center px-2 py-1 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                setInputValue(size);
                applyFontSize(size);
              }}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuBar = ({ editor, customFonts }: { editor: any, customFonts: CustomFont[] }) => {
  if (!editor) {
    return null;
  }

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Use uploadImage to compress the image and get Base64
          const { uploadImage } = await import('../lib/storage');
          const base64 = await uploadImage(file);
          editor.chain().focus().setImage({ src: base64 }).run();
        } catch (error) {
          console.error("Error adding image to editor:", error);
          alert("Lỗi tải ảnh lên.");
        }
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const MenuButton = ({ onClick, isActive, disabled, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg items-center">
      <div className="flex items-center gap-2 mr-2">
        <select
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          value={editor.getAttributes('textStyle').fontFamily || ''}
          className="text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1 px-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Mặc định</option>
          <option value="Inter">Inter</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          {customFonts.map(font => (
            <option key={font.id} value={font.name}>{font.name}</option>
          ))}
        </select>

        <FontSizeSelector editor={editor} />

        <div className="relative flex items-center">
          <input
            type="color"
            onInput={(e: any) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
            title="Màu chữ"
          />
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
      >
        <Bold className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
      >
        <Italic className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
      >
        <UnderlineIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
      >
        <Strikethrough className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
      >
        <AlignLeft className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
      >
        <AlignCenter className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
      >
        <AlignRight className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
      >
        <AlignJustify className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <div className="flex items-center gap-1">
        <div className="relative flex items-center bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
          <MoveVertical className="w-4 h-4 text-gray-500 ml-2" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setLineHeight(e.target.value).run();
              } else {
                editor.chain().focus().unsetLineHeight().run();
              }
            }}
            value={
              editor.isActive('paragraph') ? editor.getAttributes('paragraph').lineHeight || '' :
              editor.isActive('heading') ? editor.getAttributes('heading').lineHeight || '' : ''
            }
            className="text-sm bg-transparent text-gray-700 dark:text-gray-200 py-1 pl-1 pr-6 focus:ring-0 border-0 cursor-pointer appearance-none"
            title="Khoảng cách dòng"
          >
            <option value="">Mặc định</option>
            <option value="0.5">0.5</option>
            <option value="0.6">0.6</option>
            <option value="0.7">0.7</option>
            <option value="0.8">0.8</option>
            <option value="0.9">0.9</option>
            <option value="1">1.0</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2">2.0</option>
            <option value="2.5">2.5</option>
            <option value="3">3.0</option>
          </select>
        </div>

        <div className="relative flex items-center bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
          <ArrowUpDown className="w-4 h-4 text-gray-500 ml-2" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setParagraphSpacing(e.target.value).run();
              } else {
                editor.chain().focus().unsetParagraphSpacing().run();
              }
            }}
            value={
              editor.isActive('paragraph') ? editor.getAttributes('paragraph').paragraphSpacing || '' :
              editor.isActive('heading') ? editor.getAttributes('heading').paragraphSpacing || '' : ''
            }
            className="text-sm bg-transparent text-gray-700 dark:text-gray-200 py-1 pl-1 pr-6 focus:ring-0 border-0 cursor-pointer appearance-none"
            title="Khoảng cách đoạn (khi Enter)"
          >
            <option value="">Mặc định</option>
            <option value="0px">0px</option>
            <option value="4px">4px</option>
            <option value="8px">8px</option>
            <option value="12px">12px</option>
            <option value="16px">16px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
      >
        <List className="w-4 h-4" />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
      >
        <ListOrdered className="w-4 h-4" />
      </MenuButton>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />

      <MenuButton onClick={setLink} isActive={editor.isActive('link')}>
        <LinkIcon className="w-4 h-4" />
      </MenuButton>
      <MenuButton onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </MenuButton>
    </div>
  );
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  useEffect(() => {
    loadCustomFonts().then(setCustomFonts);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      LineHeight,
      ParagraphSpacing,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-indigo-600 hover:text-indigo-800 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 dark:prose-invert max-w-none',
      },
      handleDrop: function(view, event, slice, moved) {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            import('../lib/storage').then(({ uploadImage }) => {
              uploadImage(file).then((base64) => {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src: base64 });
                const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
                view.dispatch(transaction);
              }).catch(err => {
                console.error("Error adding dropped image to editor:", err);
                alert("Lỗi tải ảnh lên.");
              });
            });
            return true;
          }
        }
        return false;
      }
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <MenuBar editor={editor} customFonts={customFonts} />
      <EditorContent editor={editor} />
    </div>
  );
}
