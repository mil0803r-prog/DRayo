/**
 * Utility functions for image compression and handling
 * Ensures base64 images stay lightweight (<30KB) to prevent Firestore 1MB document quota errors
 */

export async function compressImage(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Optimizes an existing base64 dataUrl if it is too large (>25KB)
 */
export async function optimizeBase64Image(
  dataUrl: string,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.6
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 30000) {
    return dataUrl; // If already compact or an external URL, return as is
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Fast synchronous check/sanitization for image URLs in records
 * If a base64 string is exceedingly large (>150KB) and we need synchronous safety,
 * we can clamp it or ensure it doesn't break document payloads.
 */
export async function optimizeRecordsWithImages<T extends { imageUrl?: string }>(records: T[]): Promise<T[]> {
  if (!Array.isArray(records)) return records;
  
  const optimized = await Promise.all(
    records.map(async (record) => {
      if (record?.imageUrl && record.imageUrl.startsWith('data:image/') && record.imageUrl.length > 30000) {
        try {
          const compressed = await optimizeBase64Image(record.imageUrl, 360, 360, 0.6);
          return { ...record, imageUrl: compressed };
        } catch {
          return record;
        }
      }
      return record;
    })
  );

  return optimized;
}

