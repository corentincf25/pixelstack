"use client";

import { ImagePreviewModal } from "@/components/ImagePreviewModal";

type MediaLightboxProps = {
  open: boolean;
  onClose: () => void;
  type: "image" | "youtube";
  url: string;
  title?: string;
  children?: React.ReactNode;
};

/**
 * Alias du modal unique ImagePreviewModal.
 * Utilisé pour compatibilité (ex. chat). Pour versions / assets / références, utiliser ImagePreviewModal directement.
 */
export function MediaLightbox({
  open,
  onClose,
  type,
  url,
  title,
  children,
}: MediaLightboxProps) {
  return (
    <ImagePreviewModal
      open={open}
      onClose={onClose}
      type={type}
      url={url}
      title={title}
      showComments={!!children}
    >
      {children}
    </ImagePreviewModal>
  );
}
