import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '@/config/firebase';

const storage = getStorage(app);

// Maximum image dimensions and quality settings
// Reduced from 1200 to 800 for better memory handling on mobile devices
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.7;
const JPEG_QUALITY_LOW = 0.5;
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
    
    // Create object URL - must be revoked to prevent memory leaks
    const objectUrl = URL.createObjectURL(file);

    if (!ctx) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
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
            // Clean up object URL to prevent memory leaks
            URL.revokeObjectURL(objectUrl);
            
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image: Browser could not convert canvas to JPEG blob. This may occur with certain image formats.'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        // Clean up object URL on error
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      // Clean up object URL on error
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image: The image file may be corrupted or in an unsupported format'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress an image safely with fallback to original if compression fails
 * This handles memory issues on low-memory devices
 * @param file The original image file
 * @returns Promise resolving to a compressed Blob (or original file as fallback)
 */
async function compressImageSafely(file: File): Promise<Blob> {
  try {
    // Try normal compression
    let blob = await compressImage(file, JPEG_QUALITY);
    
    if (blob.size > MAX_FILE_SIZE_BYTES) {
      // If still too large, try with lower quality
      blob = await compressImage(file, JPEG_QUALITY_LOW);
    }
    
    return blob;
  } catch (error) {
    console.warn('[PhotoUpload] Image compression failed, using original:', error);
    // Return original file as blob if compression fails (memory issues)
    return file;
  }
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
  console.log(`[PhotoUpload] Starting upload for inspection ${inspectionId}, item ${itemId}, file size: ${file.size} bytes`);
  
  // Validate inputs
  if (!inspectionId || !itemId) {
    throw new Error('Invalid inspection or item ID');
  }
  
  validateImageFile(file);

  // Compress image before upload with safe fallback
  console.log(`[PhotoUpload] Compressing image...`);
  const compressedBlob = await compressImageSafely(file);
  console.log(`[PhotoUpload] Compressed size: ${compressedBlob.size} bytes`);
  
  // If still too large after compression, throw error
  if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image is too large after compression (${Math.round(compressedBlob.size / 1024)}KB). Please use a smaller image.`);
  }

  const timestamp = Date.now();
  const path = `inspections/${inspectionId}/${itemId}_${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);
  console.log(`[PhotoUpload] Upload complete, URL: ${url}`);
  return url;
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
  console.log(`[PhotoUpload] Starting defect photo upload for inspection ${inspectionId}, file size: ${file.size} bytes`);
  
  // Validate inputs
  if (!inspectionId) {
    throw new Error('Invalid inspection ID');
  }
  
  validateImageFile(file);

  // Compress image before upload with safe fallback
  console.log(`[PhotoUpload] Compressing image...`);
  const compressedBlob = await compressImageSafely(file);
  console.log(`[PhotoUpload] Compressed size: ${compressedBlob.size} bytes`);
  
  // If still too large after compression, throw error
  if (compressedBlob.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Image is too large after compression (${Math.round(compressedBlob.size / 1024)}KB). Please use a smaller image.`);
  }

  const timestamp = Date.now();
  const path = `inspections/${inspectionId}/defect_${timestamp}.jpg`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);
  console.log(`[PhotoUpload] Upload complete, URL: ${url}`);
  return url;
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
