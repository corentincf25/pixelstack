/**
 * Compression d'image côté client (Canvas) pour réduire la taille avant upload.
 * Max 1200px de large, JPEG qualité 0.78. Retourne un Blob.
 */
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.78;
const MAX_OUTPUT_BYTES = 500 * 1024; // 500 Ko max cible

export async function compressImageForChat(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Fichier non supporté");
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      let width = w;
      let height = h;
      if (w > MAX_WIDTH || h > MAX_HEIGHT) {
        const r = Math.min(MAX_WIDTH / w, MAX_HEIGHT / h);
        width = Math.round(w * r);
        height = Math.round(h * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas non disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let q = JPEG_QUALITY;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Échec compression"));
              return;
            }
            if (blob.size > MAX_OUTPUT_BYTES && q > 0.4) {
              q -= 0.12;
              tryEncode();
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          q
        );
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image non lisible"));
    };
    img.src = url;
  });
}

/** Photo de profil : max 280px, JPEG, cible 500 Ko max. Compression agressive pour accepter les images lourdes. */
const AVATAR_MAX_SIZE = 280;
const AVATAR_MAX_BYTES = 500 * 1024; // 500 Ko
const AVATAR_QUALITY_START = 0.75;
const AVATAR_QUALITY_MIN = 0.2;

export async function compressImageForAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Fichier non supporté");
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const r = Math.min(AVATAR_MAX_SIZE / w, AVATAR_MAX_SIZE / h, 1);
      const width = Math.max(1, Math.round(w * r));
      const height = Math.max(1, Math.round(h * r));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas non disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let q = AVATAR_QUALITY_START;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Échec compression"));
              return;
            }
            if (blob.size > AVATAR_MAX_BYTES && q > AVATAR_QUALITY_MIN) {
              q = Math.max(AVATAR_QUALITY_MIN, q - 0.12);
              tryEncode();
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          q
        );
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image non lisible"));
    };
    img.src = url;
  });
}
