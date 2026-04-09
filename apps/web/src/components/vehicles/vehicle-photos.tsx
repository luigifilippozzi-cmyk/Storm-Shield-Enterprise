'use client';

import { useState, useRef } from 'react';
import { useUploadVehiclePhoto, useDeleteVehiclePhoto, type VehiclePhoto } from '@/hooks/use-vehicles';
import { Button } from '@/components/ui/button';

interface VehiclePhotosProps {
  vehicleId: string;
  photos: VehiclePhoto[];
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  damage: 'Damage',
  before: 'Before',
  after: 'After',
  detail: 'Detail',
};

export function VehiclePhotos({ vehicleId, photos }: VehiclePhotosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadPhoto = useUploadVehiclePhoto(vehicleId);
  const deletePhoto = useDeleteVehiclePhoto(vehicleId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadPhoto.mutateAsync({ file, photo_type: 'general' });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photoId: string, fileName: string) => {
    if (!confirm(`Delete photo "${fileName}"?`)) return;
    await deletePhoto.mutateAsync(photoId);
  };

  return (
    <section className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold">Photos ({photos.length})</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
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
            {uploading ? 'Uploading...' : '+ Upload Photo'}
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No photos yet</p>
          <p className="mt-1 text-sm">Upload photos to document the vehicle condition.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border bg-muted/30"
            >
              <div className="aspect-square flex items-center justify-center bg-muted/50">
                {photo.url || photo.storage_key ? (
                  <img
                    src={photo.url || `/api/storage/${photo.storage_key}`}
                    alt={photo.description || photo.file_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={photo.url || photo.storage_key ? 'hidden' : ''}>
                  <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{photo.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {PHOTO_TYPE_LABELS[photo.photo_type] || photo.photo_type}
                </p>
              </div>
              <button
                onClick={() => handleDelete(photo.id, photo.file_name)}
                className="absolute right-1 top-1 rounded-full bg-destructive/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                disabled={deletePhoto.isPending}
                title="Delete photo"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
