'use client';

import { useState, useRef } from 'react';
import { useUploadEstimateDocument, useDeleteEstimateDocument, type EstimateDocument } from '@/hooks/use-estimates';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface EstimateDocumentsProps {
  estimateId: string;
  documents: EstimateDocument[];
}

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance_estimate: 'Insurance Estimate',
  supplement: 'Supplement',
  photo: 'Photo',
  invoice: 'Invoice',
  other: 'Other',
};

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

export function EstimateDocuments({ estimateId, documents }: EstimateDocumentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadDoc = useUploadEstimateDocument(estimateId);
  const deleteDoc = useDeleteEstimateDocument(estimateId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadDoc.mutateAsync({ file, document_type: 'other' });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm(`Delete document "${fileName}"?`)) return;
    await deleteDoc.mutateAsync(docId);
  };

  const getExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  return (
    <section className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Documents ({documents.length})</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '+ Upload Document'}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No documents attached</p>
          <p className="mt-1 text-sm">Upload insurance estimates, supplements, or other documents.</p>
        </div>
      ) : (
        <div className="divide-y">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                {getExtension(doc.file_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPE_LABELS[doc.document_type] || doc.document_type} &middot; {formatDate(doc.created_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(doc.id, doc.file_name)}
                disabled={deleteDoc.isPending}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
