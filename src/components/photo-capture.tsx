"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

export function PhotoCapture({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("receipts")
      .createSignedUrl(value, 60 * 5)
      .then(({ data }) => {
        if (!cancelled && data) setPreviewUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function handleFile(file: File) {
    setError(null);

    const localUrl = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = localUrl;
    setPreviewUrl(localUrl);
    setIsUploading(true);

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1000,
        maxSizeMB: 1,
        useWebWorker: true,
      });

      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, compressed, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      onChange(path);
    } catch {
      setError("Tải ảnh lên thất bại, thử lại.");
      setPreviewUrl(null);
      onChange(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {previewUrl ? (
        <div className="relative w-fit">
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="block h-20 w-20 overflow-hidden rounded-xl border border-ink/15"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Hoá đơn"
              className="h-full w-full object-cover"
            />
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onChange(null);
            }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-paper"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-ink/25 text-2xl text-ink/40">
          📷
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {isUploading && <p className="text-xs text-ink/50">Đang tải ảnh…</p>}
      {error && <p className="text-xs text-a">{error}</p>}

      {isZoomed && previewUrl && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setIsZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Hoá đơn"
            className="max-h-full max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
