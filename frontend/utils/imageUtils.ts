
/**
 * Compresses an image file to WebP format using the browser's Canvas API.
 * 
 * @param file - The original File object (JPEG/PNG)
 * @param quality - Compression quality (0.0 to 1.0), default 0.8
 * @param maxWidth - Optional max width to resize large images (e.g. 1920px)
 * @returns Promise<File> - The compressed WebP file
 */
export const compressImage = async (file: File, quality: number = 0.8, maxWidth: number = 1920): Promise<File> => {
    // 1. Skip non-images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // 2. Calculate new dimensions (Simple aspect ratio preserve)
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // 3. Create Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fallback to original if canvas fails
                    return;
                }

                // 4. Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // 5. Export as WebP
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file); // Fallback
                        return;
                    }

                    // Create new File with .webp extension
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    const newFile = new File([blob], newName, {
                        type: 'image/webp',
                        lastModified: Date.now(),
                    });

                    console.log(`Compressed: ${file.size / 1024}KB -> ${newFile.size / 1024}KB`);
                    resolve(newFile);
                }, 'image/webp', quality);
            };

            img.onerror = (err) => reject(err);
        };

        reader.onerror = (err) => reject(err);
    });
};
