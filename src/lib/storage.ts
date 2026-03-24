import imageCompression from 'browser-image-compression';

export const uploadImage = async (file: File, path: string = 'projects'): Promise<string> => {
  try {
    // Nén ảnh trước khi upload
    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: false,
      initialQuality: 0.9,
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // Gửi ảnh lên server local
    const formData = new FormData();
    formData.append('image', compressedFile, file.name);

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
