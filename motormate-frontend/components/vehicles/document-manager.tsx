'use client';

import { useCallback, useRef, useState } from 'react';
import {
  useUploadDocuments,
  useDeleteDocument,
  useDocumentDownload,
  type DocUploadProgress,
  type UploadDocumentPayload,
} from '@/hooks/use-documents';
import type { VehicleDocument, DocumentType } from '@/types';
import { api } from '@/lib/api';

const MAX_FILES = 20;
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// ─── Doc type config ──────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  BLUE_BOOK: 'Blue Book',
  CMT: 'CMT',
  REVENUE_LICENCE: 'Revenue Licence',
  INSURANCE: 'Insurance',
  SIGNED_LETTER: 'Signed Letter',
  NIC: 'NIC',
  OTHER: 'Other',
};

const DOC_TYPE_COLORS: Record<DocumentType, string> = {
  BLUE_BOOK: 'bg-blue-50 text-blue-700 ring-blue-200',
  CMT: 'bg-violet-50 text-violet-700 ring-violet-200',
  REVENUE_LICENCE: 'bg-green-50 text-green-700 ring-green-200',
  INSURANCE: 'bg-amber-50 text-amber-700 ring-amber-200',
  SIGNED_LETTER: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  NIC: 'bg-rose-50 text-rose-700 ring-rose-200',
  OTHER: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function PdfIcon() {
  return (
    <svg className="h-8 w-8 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ImgIcon() {
  return (
    <svg className="h-8 w-8 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
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

// ─── Upload modal ─────────────────────────────────────────────────────────────

function UploadModal({
  vehicleId,
  existingCount,
  onClose,
}: {
  vehicleId: string;
  existingCount: number;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [docType, setDocType] = useState<DocumentType>('OTHER');
  const [expiryDate, setExpiryDate] = useState('');
  const [queue, setQueue] = useState<DocUploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocuments(vehicleId);
  const remaining = MAX_FILES - existingCount;

  function validate(raw: File[]): { valid: File[]; errors: string[] } {
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of raw) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        errors.push(`${f.name}: only PDF, JPG, PNG allowed`);
      } else if (f.size > MAX_SIZE_BYTES) {
        errors.push(`${f.name}: exceeds ${MAX_SIZE_MB} MB`);
      } else {
        valid.push(f);
      }
    }
    if (valid.length > remaining) {
      errors.push(`Only ${remaining} more document(s) allowed (max ${MAX_FILES})`);
      valid.splice(remaining);
    }
    return { valid, errors };
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files ?? []);
    const { valid, errors } = validate(raw);
    if (errors.length) alert(errors.join('\n'));
    setFiles(valid);
    e.target.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;

    const payload: UploadDocumentPayload = {
      files,
      docType,
      expiryDate: expiryDate || undefined,
      onProgress: setQueue,
    };

    upload.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  }

  const isUploading = upload.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl sm:shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Upload Document</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">File(s)</label>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 py-4 text-center text-xs text-zinc-500 hover:border-zinc-400 hover:bg-white disabled:opacity-50"
            >
              {files.length > 0
                ? files.map((f) => f.name).join(', ')
                : 'Tap to select PDF, JPG, or PNG'}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleChange}
              disabled={isUploading}
            />
          </div>

          {/* Doc type */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              disabled={isUploading}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
            >
              {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Expiry date */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Expiry Date <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isUploading}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
            />
          </div>

          {/* Progress */}
          {queue.length > 0 && (
            <div className="space-y-2">
              {queue.map((item) => (
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
                  {item.error && <p className="mt-1 text-xs text-red-500">{item.error}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={files.length === 0 || isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isUploading ? 'Uploading…' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Single document row ──────────────────────────────────────────────────────

function DocRow({
  doc,
  vehicleId,
}: {
  doc: VehicleDocument;
  vehicleId: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteDoc = useDeleteDocument(vehicleId);
  const getDownload = useDocumentDownload(vehicleId);

  const isPdf = doc.name.toLowerCase().endsWith('.pdf');

  function handlePreview() {
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  }

  function handleDownload() {
    getDownload.mutate(doc.id, {
      onSuccess: ({ url, name }) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.click();
      },
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3.5">
      {/* File icon */}
      {isPdf ? <PdfIcon /> : <ImgIcon />}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-zinc-900">{doc.name}</p>
          {doc.isLocked && (
            <span
              className="flex items-center gap-1 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold text-white"
              title="Locked after sale"
            >
              <LockIcon />
              Locked
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${DOC_TYPE_COLORS[doc.docType]}`}>
            {DOC_TYPE_LABELS[doc.docType]}
          </span>
          <span className="text-[10px] text-zinc-400">
            Uploaded {formatDate(doc.createdAt)}
          </span>
          {doc.expiryDate && (
            <span className="text-[10px] text-zinc-400">
              Expires {formatDate(doc.expiryDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={handlePreview}
          className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50"
          title="Preview"
        >
          Preview
        </button>
        <button
          onClick={handleDownload}
          disabled={getDownload.isPending}
          className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          title="Download"
        >
          {getDownload.isPending ? '…' : 'Download'}
        </button>

        {!doc.isLocked && (
          confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => { deleteDoc.mutate(doc.id); setConfirmDelete(false); }}
                disabled={deleteDoc.isPending}
                className="rounded-lg bg-red-500 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-600"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50"
              title="Delete document"
            >
              <TrashIcon />
            </button>
          )
        )}

        {doc.isLocked && (
          <div
            className="rounded-lg border border-zinc-100 p-1.5 text-zinc-300 cursor-not-allowed"
            title="Locked after sale — cannot delete"
          >
            <TrashIcon />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Document manager (main export) ──────────────────────────────────────────

export function DocumentManager({
  vehicleId,
  documents,
}: {
  vehicleId: string;
  documents: VehicleDocument[];
}) {
  const [showModal, setShowModal] = useState(false);

  function handleDownloadAll() {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${vehicleId}/documents/download-all`;
    const a = document.createElement('a');
    a.href = url;
    // Pass auth via query param is not ideal but works for file downloads
    // Better: use a temp signed URL from backend (current impl streams directly)
    // The browser will follow the redirect with the same headers only if same-origin
    // For cross-origin downloads with auth, we fetch as blob:
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        const disposition = res.headers.get('content-disposition') ?? '';
        const nameMatch = disposition.match(/filename="(.+)"/);
        const filename = nameMatch?.[1] ?? 'documents.zip';
        return res.blob().then((blob) => ({ blob, filename }));
      })
      .then(({ blob, filename }) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => alert('Failed to download ZIP'));
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          {documents.length} / {MAX_FILES} documents
          {documents.some((d) => d.isLocked) && (
            <span className="ml-2 inline-flex items-center gap-1 text-zinc-500">
              <LockIcon />
              locked after sale
            </span>
          )}
        </p>
        <div className="flex gap-2">
          {documents.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Download All
            </button>
          )}
          {documents.length < MAX_FILES && (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
            >
              + Upload
            </button>
          )}
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">No documents yet.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Upload Blue Book, Insurance, or other vehicle documents.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocRow key={doc.id} doc={doc} vehicleId={vehicleId} />
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showModal && (
        <UploadModal
          vehicleId={vehicleId}
          existingCount={documents.length}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
