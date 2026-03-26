import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from './storage';

export interface CustomFont {
  id: string;
  name: string;
  url: string;
  format: string;
  isGoogleFont?: boolean;
}

export const loadCustomFonts = async (): Promise<CustomFont[]> => {
  try {
    const snap = await getDocs(collection(db, 'fonts'));
    const fonts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomFont));
    
    // Inject fonts into document head
    fonts.forEach(font => {
      if (!document.getElementById(`font-${font.id}`)) {
        if (font.isGoogleFont) {
          const link = document.createElement('link');
          link.id = `font-${font.id}`;
          link.rel = 'stylesheet';
          link.href = font.url;
          document.head.appendChild(link);
        } else {
          const style = document.createElement('style');
          style.id = `font-${font.id}`;
          style.innerHTML = `
            @font-face {
              font-family: '${font.name}';
              src: url('${font.url}') format('${font.format}');
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }
          `;
          document.head.appendChild(style);
        }
      }
    });
    
    return fonts;
  } catch (error) {
    console.error("Error loading fonts:", error);
    return [];
  }
};

export const uploadCustomFont = async (file: File, name: string): Promise<CustomFont> => {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const format = fileExtension === 'ttf' ? 'truetype' : fileExtension === 'woff' ? 'woff' : fileExtension === 'woff2' ? 'woff2' : 'opentype';
    
    // Upload font file to local server
    const fontUrl = await uploadFile(file);
    
    const font: CustomFont = {
      id: uuidv4(),
      name,
      url: fontUrl,
      format,
    };
    
    await setDoc(doc(db, 'fonts', font.id), font);
    
    // Inject immediately
    const style = document.createElement('style');
    style.id = `font-${font.id}`;
    style.innerHTML = `
      @font-face {
        font-family: '${font.name}';
        src: url('${font.url}') format('${font.format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    return font;
  } catch (error) {
    console.error("Error uploading font:", error);
    throw error;
  }
};

export const addGoogleFont = async (name: string, url: string): Promise<CustomFont> => {
  try {
    const font: CustomFont = {
      id: uuidv4(),
      name,
      url,
      format: 'google',
      isGoogleFont: true,
    };
    
    await setDoc(doc(db, 'fonts', font.id), font);
    
    // Inject immediately
    const link = document.createElement('link');
    link.id = `font-${font.id}`;
    link.rel = 'stylesheet';
    link.href = font.url;
    document.head.appendChild(link);
    
    return font;
  } catch (error) {
    console.error("Error adding Google font:", error);
    throw error;
  }
};

export const deleteCustomFont = async (font: CustomFont) => {
  try {
    await deleteDoc(doc(db, 'fonts', font.id));
    
    // Only try to delete from storage if it's a Firebase Storage URL
    if (font.url.includes('firebasestorage')) {
      const storageRef = ref(storage, font.url);
      await deleteObject(storageRef);
    }
    
    const styleEl = document.getElementById(`font-${font.id}`);
    if (styleEl) {
      styleEl.remove();
    }
  } catch (error) {
    console.error("Error deleting font:", error);
    throw error;
  }
};
