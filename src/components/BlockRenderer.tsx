import React, { useState, useEffect } from 'react';
import { ContentBlock } from '../types';

interface BlockRendererProps {
  blocks: ContentBlock[] | string;
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks) return null;

  if (typeof blocks === 'string') {
    return <div className="prose prose-lg prose-indigo dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: blocks }} />;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        switch (block.type) {
          case 'rich-text':
            return (
              <div key={block.id} className="prose prose-lg prose-indigo dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />
            );
          case 'single-image':
            return (
              <div key={block.id} className={`flex ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
                <img src={block.imageUrl || undefined} alt="Project image" className="max-w-full rounded-xl shadow-md" style={{ maxHeight: '80vh' }} />
              </div>
            );
          case 'image-slider':
            return <ImageSlider key={block.id} urls={block.imageUrls} />;
          case 'image-text':
            return (
              <div key={block.id} className={`flex flex-col md:flex-row gap-8 items-center ${block.imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-1/2">
                  <img src={block.imageUrl || undefined} alt="Project image" className="w-full rounded-xl shadow-md" />
                </div>
                <div className="w-full md:w-1/2 prose prose-lg prose-indigo dark:prose-invert max-w-none text-justify" dangerouslySetInnerHTML={{ __html: block.text }} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

const ImageSlider: React.FC<{ urls: string[] }> = ({ urls }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (urls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % urls.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [urls.length]);

  if (!urls || urls.length === 0) return null;

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg group">
      {urls.map((url, index) => (
        <img
          key={index}
          src={url || undefined}
          alt={`Slide ${index}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % urls.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {urls.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
