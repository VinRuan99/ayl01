import imageCompression from 'browser-image-compression';

export const uploadImage = async (file: File, path: string = 'projects'): Promise<string> => {
  try {
    // Compress image heavily to avoid Firestore 1MB document limit
    const options = {
      maxSizeMB: 0.05, // Max 50KB
      maxWidthOrHeight: 800,
      useWebWorker: false, // Disable web worker to prevent hanging in iframe
      initialQuality: 0.6,
    };
    
    const compressedFile = await imageCompression(file, options);
    
    // Convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = (error) => {
        console.error("Error converting image to Base64:", error);
        reject(error);
      };
    });
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};
