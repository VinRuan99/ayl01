export type BlockType = 'rich-text' | 'single-image' | 'image-slider' | 'image-text';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface RichTextBlock extends BaseBlock {
  type: 'rich-text';
  content: string;
}

export interface SingleImageBlock extends BaseBlock {
  type: 'single-image';
  imageUrl: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageSliderBlock extends BaseBlock {
  type: 'image-slider';
  imageUrls: string[];
}

export interface ImageTextBlock extends BaseBlock {
  type: 'image-text';
  imageUrl: string;
  text: string;
  imagePosition: 'left' | 'right';
  ratio?: '50-50' | '70-30';
}

export type ContentBlock = RichTextBlock | SingleImageBlock | ImageSliderBlock | ImageTextBlock;

export interface Project {
  id: string;
  title: Record<string, string>;
  description: Record<string, string | ContentBlock[]>; // Support legacy string descriptions
  location: Record<string, string>;
  price: number;
  area: number;
  type: string;
  images: string[];
  createdAt: string;
  createdBy: string;
  order?: number;
}
