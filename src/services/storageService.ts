import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '@/config/firebase';

const storage = getStorage(app);

// Maximum image dimensions and quality settings
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.8;
const JPEG_QUALITY_LOW = 0.6;
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB

/**
 * Compress an image file using canvas
 * @param file The original image file
 * @param quality JPEG quality (0-1)
 * @returns Promise resolving to a compressed Blob
 */
async function compressImage(file: File, quality: number = JPEG_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }
      
      if (height > MAX_HEIGHT) {
        width = (width * MAX_HEIGHT) / height;
        height = MAX_HEIGHT;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image: Browser could not convert canvas to JPEG blob. This may occur with certain image formats.'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image: The image file may be corrupted or in an unsupported format'));
    };

    // Create object URL from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate file is an image and within size limits
 * @param file The file to validate
 */
function validateImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  // Check file size before compression (allow up to 10MB for upload, will be compressed)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image file is too large (max 10MB)');
  }
}

/**
 * Upload a photo for an inspection checklist item
 * @param inspectionId The inspection ID
 * @param itemId The checklist item ID
 * @param file The image file to upload
 * @returns Promise resolving to the download URL
 */
export async function uploadInspectionPhoto(
  inspectionId: string,
  itemId: string,
  file: File
): Promise<string> {
  // Validate inputs
  if (!inspectionId || !itemId) {
    throw new Error('Invalid inspection or item ID');
  }
  
  validateImageFile(file);

  // Compress image before upload
  let compressedBlob = await compressImage(file);
  
  // If still too large, try with lower quality
  if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
    compressedBlob = await compressImage(file, JPEG_QUALITY_LOW);
    
    // If still too large after lower quality, throw error
    if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Image is too large after compression (${Math.round(compressedBlob.size / 1024)}KB). Please use a smaller image.`);
    }
  }

  const timestamp = Date.now();
  const path = `inspections/${inspectionId}/${itemId}_${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  return await getDownloadURL(storageRef);
}

/**
 * Upload a defect photo for an inspection
 * @param inspectionId The inspection ID
 * @param file The image file to upload
 * @returns Promise resolving to the download URL
 */
export async function uploadDefectPhoto(
  inspectionId: string,
  file: File
): Promise<string> {
  // Validate inputs
  if (!inspectionId) {
    throw new Error('Invalid inspection ID');
  }
  
  validateImageFile(file);

  // Compress image before upload
  let compressedBlob = await compressImage(file);
  
  // If still too large, try with lower quality
  if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
    compressedBlob = await compressImage(file, JPEG_QUALITY_LOW);
    
    // If still too large after lower quality, throw error
    if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Image is too large after compression (${Math.round(compressedBlob.size / 1024)}KB). Please use a smaller image.`);
    }
  }

  const timestamp = Date.now();
  const path = `inspections/${inspectionId}/defect_${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  return await getDownloadURL(storageRef);
}

/**
 * Delete a photo from Firebase Storage
 * @param photoUrl The full URL of the photo to delete
 */
export async function deleteInspectionPhoto(photoUrl: string): Promise<void> {
  if (!photoUrl) {
    throw new Error('Invalid photo URL');
  }

  try {
    const storageRef = ref(storage, photoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    // If the file doesn't exist, ignore the error
    const firebaseError = error as { code?: string };
    if (firebaseError.code !== 'storage/object-not-found') {
      throw error;
    }
  }
}
