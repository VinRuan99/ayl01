import React, { useState, useEffect } from 'react';
import { ContentBlock, RichTextBlock, SingleImageBlock, ImageSliderBlock, ImageTextBlock } from '../types';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Type, Layout, AlignLeft, AlignCenter, AlignRight, Upload } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { uploadImage } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [loading, setLoading] = useState(false);

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: any = { id: uuidv4(), type };
    if (type === 'rich-text') newBlock.content = '';
    if (type === 'single-image') { newBlock.imageUrl = ''; newBlock.align = 'center'; }
    if (type === 'image-slider') newBlock.imageUrls = [];
    if (type === 'image-text') { newBlock.imageUrl = ''; newBlock.text = ''; newBlock.imagePosition = 'left'; }
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, data: Partial<ContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...data } as ContentBlock : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + (direction === 'up' ? -1 : 1)];
    newBlocks[index + (direction === 'up' ? -1 : 1)] = temp;
    onChange(newBlocks);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadImage(file);
      callback(url);
    } catch (error) {
      alert('Lỗi tải ảnh lên');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (urls: string[]) => void) => {
    const files = e.target.files;
    if (!files) return;
    setLoading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        urls.push(url);
      }
      callback(urls);
    } catch (error) {
      alert('Lỗi tải ảnh lên');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>, callback: (url: string) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      const url = await uploadImage(file);
      callback(url);
    } catch (error) {
      alert('Lỗi tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleDrop = async (e: React.DragEvent<HTMLLabelElement>, callback: (urls: string[]) => void) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const url = await uploadImage(files[i]);
          urls.push(url);
        }
      }
      callback(urls);
    } catch (error) {
      alert('Lỗi tải ảnh lên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => (
        <div key={block.id} className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 group">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30">
              <ArrowDown className="w-4 h-4" />
            </button>
            <button onClick={() => removeBlock(block.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {block.type === 'rich-text' && 'Văn bản'}
            {block.type === 'single-image' && 'Ảnh đơn'}
            {block.type === 'image-slider' && 'Slider ảnh'}
            {block.type === 'image-text' && 'Ảnh + Chữ'}
          </div>

          {block.type === 'rich-text' && (
            <RichTextEditor
              content={block.content}
              onChange={(content) => updateBlock(block.id, { content })}
            />
          )}

          {block.type === 'single-image' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateBlock(block.id, { align: 'left' })} className={`p-2 rounded ${block.align === 'left' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}><AlignLeft className="w-4 h-4" /></button>
                <button onClick={() => updateBlock(block.id, { align: 'center' })} className={`p-2 rounded ${block.align === 'center' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}><AlignCenter className="w-4 h-4" /></button>
                <button onClick={() => updateBlock(block.id, { align: 'right' })} className={`p-2 rounded ${block.align === 'right' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}><AlignRight className="w-4 h-4" /></button>
              </div>
              {block.imageUrl ? (
                <div className={`flex ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
                  <div className="relative group/img">
                    <img src={block.imageUrl || undefined} alt="Single" className="max-h-64 rounded-lg object-contain" />
                    <button onClick={() => updateBlock(block.id, { imageUrl: '' })} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, (url) => updateBlock(block.id, { imageUrl: url }))}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="text-sm text-gray-500">{loading ? 'Đang tải lên...' : 'Kéo thả hoặc bấm để tải ảnh lên'}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateBlock(block.id, { imageUrl: url }))} disabled={loading} />
                  </label>
                  <div className="flex w-full gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Hoặc nhập link ảnh (URL)..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const url = e.currentTarget.value.trim();
                          if (url) {
                            updateBlock(block.id, { imageUrl: url });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {block.type === 'image-slider' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {block.imageUrls.map((url, i) => (
                  <div key={i} className="relative group/img aspect-[4/3] rounded-lg overflow-hidden border">
                    <img src={url || undefined} alt={`Slide ${i}`} className="w-full h-full object-cover" />
                    <button onClick={() => updateBlock(block.id, { imageUrls: block.imageUrls.filter((_, idx) => idx !== i) })} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex flex-col gap-2">
                  <label 
                    className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleMultipleDrop(e, (urls) => updateBlock(block.id, { imageUrls: [...block.imageUrls, ...urls] }))}
                  >
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <Plus className="w-6 h-6 text-gray-500 mx-auto" />
                      <span className="text-xs text-gray-500 mt-1">{loading ? 'Đang tải...' : 'Kéo thả hoặc bấm thêm ảnh'}</span>
                    </div>
                    <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleMultipleImageUpload(e, (urls) => updateBlock(block.id, { imageUrls: [...block.imageUrls, ...urls] }))} disabled={loading} />
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập link ảnh (URL)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = e.currentTarget.value.trim();
                        if (url) {
                          updateBlock(block.id, { imageUrls: [...block.imageUrls, url] });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs dark:bg-gray-700 dark:text-white px-2 py-1 border"
                  />
                </div>
              </div>
            </div>
          )}

          {block.type === 'image-text' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                <button onClick={() => updateBlock(block.id, { imagePosition: 'left' })} className={`px-3 py-1 text-sm rounded ${block.imagePosition === 'left' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>Ảnh bên trái</button>
                <button onClick={() => updateBlock(block.id, { imagePosition: 'right' })} className={`px-3 py-1 text-sm rounded ${block.imagePosition === 'right' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>Ảnh bên phải</button>
              </div>
              <div className={`flex flex-col md:flex-row gap-6 ${block.imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-1/2">
                  {block.imageUrl ? (
                    <div className="relative group/img">
                      <img src={block.imageUrl || undefined} alt="Block" className="w-full rounded-lg object-cover" />
                      <button onClick={() => updateBlock(block.id, { imageUrl: '' })} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label 
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, (url) => updateBlock(block.id, { imageUrl: url }))}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="text-sm text-gray-500">{loading ? 'Đang tải lên...' : 'Kéo thả hoặc bấm để tải ảnh lên'}</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateBlock(block.id, { imageUrl: url }))} disabled={loading} />
                      </label>
                      <div className="flex w-full gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Hoặc nhập link ảnh (URL)..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const url = e.currentTarget.value.trim();
                              if (url) {
                                updateBlock(block.id, { imageUrl: url });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-full md:w-1/2">
                  <RichTextEditor
                    content={block.text}
                    onChange={(text) => updateBlock(block.id, { text })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onClick={() => addBlock('rich-text')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
          <Type className="w-4 h-4" /> Thêm Văn bản
        </button>
        <button onClick={() => addBlock('single-image')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
          <ImageIcon className="w-4 h-4" /> Thêm Ảnh đơn
        </button>
        <button onClick={() => addBlock('image-slider')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
          <Layout className="w-4 h-4" /> Thêm Slider
        </button>
        <button onClick={() => addBlock('image-text')} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
          <Layout className="w-4 h-4" /> Thêm Ảnh + Chữ
        </button>
      </div>
    </div>
  );
}
