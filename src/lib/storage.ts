import imageCompression from 'browser-image-compression';

export const uploadImage = async (file: File, path: string = 'projects'): Promise<string> => {
  try {
    let fileToUpload = file;
    
    // Bỏ qua nén ảnh đối với ảnh GIF, SVG
    if (file.type !== 'image/gif' && file.type !== 'image/svg+xml') {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: false,
        initialQuality: 0.9,
      };
      try {
        fileToUpload = await imageCompression(file, options);
      } catch (compressionError) {
        console.warn("Image compression failed, using original file:", compressionError);
      }
    }
    
    // Gửi ảnh lên server local
    const formData = new FormData();
    formData.append('image', fileToUpload, file.name);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error("Error uploading image to local server:", error);
    throw error;
  }
};
