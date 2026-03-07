'use client';

import { useCallback, useRef, useState } from 'react';
import { useUploadImages, useSetPrimary, useDeleteImage } from '@/hooks/use-images';
import type { UploadProgress } from '@/hooks/use-images';
import type { VehicleImage } from '@/types';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Icons ────────────────────────────────────────────────────────────────────

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ─── Upload drop zone ─────────────────────────────────────────────────────────

function DropZone({
  existingCount,
  onFiles,
  isUploading,
}: {
  existingCount: number;
  onFiles: (files: File[]) => void;
  isUploading: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_FILES - existingCount;

  function validate(rawFiles: File[]): { valid: File[]; errors: string[] } {
    const errors: string[] = [];
    const valid: File[] = [];

    for (const f of rawFiles) {
      if (!f.type.startsWith('image/')) {
        errors.push(`${f.name}: not an image`);
      } else if (f.size > MAX_SIZE_BYTES) {
        errors.push(`${f.name}: exceeds ${MAX_SIZE_MB} MB`);
      } else {
        valid.push(f);
      }
    }

    if (valid.length > remaining) {
      errors.push(`Only ${remaining} more photo(s) allowed (max ${MAX_FILES})`);
      valid.splice(remaining);
    }

    return { valid, errors };
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const { valid, errors } = validate(files);
    if (errors.length) alert(errors.join('\n'));
    if (valid.length) onFiles(valid);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const { valid, errors } = validate(files);
    if (errors.length) alert(errors.join('\n'));
    if (valid.length) onFiles(valid);
    e.target.value = '';
  }

  if (remaining <= 0) return null;

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 transition-colors ${
        dragging
          ? 'border-zinc-400 bg-zinc-100'
          : isUploading
            ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60'
            : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 hover:bg-white'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />
      <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-700">
          {dragging ? 'Drop photos here' : 'Drag & drop or tap to select'}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          Up to {remaining} more · Max {MAX_SIZE_MB} MB each · Images only
        </p>
      </div>
    </div>
  );
}

// ─── Upload progress list ─────────────────────────────────────────────────────

function UploadQueue({ items }: { items: UploadProgress[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.fileId} className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="max-w-[70%] truncate text-xs font-medium text-zinc-700">
              {item.fileName}
            </span>
            <span className={`text-xs font-medium ${
              item.status === 'error' ? 'text-red-500' :
              item.status === 'done' ? 'text-emerald-600' : 'text-zinc-400'
            }`}>
              {item.status === 'error' ? 'Failed' :
               item.status === 'done' ? 'Done' : `${item.progress}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${
                item.status === 'error' ? 'bg-red-400' :
                item.status === 'done' ? 'bg-emerald-500' : 'bg-zinc-800'
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
          {item.error && (
            <p className="mt-1 text-xs text-red-500">{item.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Photo grid ───────────────────────────────────────────────────────────────

function PhotoGrid({
  images,
  vehicleId,
}: {
  images: VehicleImage[];
  vehicleId: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const setPrimary = useSetPrimary(vehicleId);
  const deleteImage = useDeleteImage(vehicleId);

  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((img) => (
        <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
          <img src={img.url} alt="" className="h-full w-full object-cover" />

          {/* Primary badge */}
          {img.isPrimary && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
              Primary
            </span>
          )}

          {/* Action overlay */}
          <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Star (set primary) */}
            {!img.isPrimary && (
              <button
                onClick={() => setPrimary.mutate(img.id)}
                disabled={setPrimary.isPending}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-amber-500 shadow hover:bg-white disabled:opacity-50"
                title="Set as primary"
              >
                <StarIcon filled={false} />
              </button>
            )}
            {img.isPrimary && (
              <span className="flex h-7 w-7 items-center justify-center text-amber-400">
                <StarIcon filled={true} />
              </span>
            )}

            {/* Delete */}
            {confirmDelete === img.id ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { deleteImage.mutate(img.id); setConfirmDelete(null); }}
                  disabled={deleteImage.isPending}
                  className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-medium text-zinc-700"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(img.id)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow hover:bg-white"
                title="Delete photo"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Photo manager (main export) ─────────────────────────────────────────────

export function PhotoManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: VehicleImage[];
}) {
  const [queue, setQueue] = useState<UploadProgress[]>([]);
  const upload = useUploadImages(vehicleId);

  const handleFiles = useCallback(
    (files: File[]) => {
      upload.mutate({
        files,
        onProgress: setQueue,
      });
    },
    [upload],
  );

  // Sort: primary first
  const sorted = [...images].sort((a, b) =>
    a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
  );

  return (
    <div className="space-y-4">
      <DropZone
        existingCount={images.length}
        onFiles={handleFiles}
        isUploading={upload.isPending}
      />
      {upload.isPending && <UploadQueue items={queue} />}
      <PhotoGrid images={sorted} vehicleId={vehicleId} />
      {images.length === 0 && !upload.isPending && (
        <p className="text-center text-sm text-zinc-400">
          No photos yet. Upload some above.
        </p>
      )}
      <p className="text-right text-xs text-zinc-400">
        {images.length} / {MAX_FILES} photos
      </p>
    </div>
  );
}
