import { Text, Button } from "@canva/app-ui-kit";
import { Asset, UploadProgress } from "../types";

interface AssetCardProps {
  asset: Asset;
  progress?: UploadProgress;
  progressOriginal?: UploadProgress;
  onInsertAsset: (asset: Asset) => void;
  onInsertOriginal: (asset: Asset) => void;
  getThumbnailUrl: (asset: Asset) => string | null;
}

export function AssetCard({
  asset,
  progress,
  progressOriginal,
  onInsertAsset,
  onInsertOriginal,
  getThumbnailUrl
}: AssetCardProps) {
  const isUploading = (progress && progress.status !== 'completed') || (progressOriginal && progressOriginal.status !== 'completed');

  return (
    <div
      key={asset.id}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        opacity: isUploading ? 0.7 : 1
      }}
      onClick={() => !isUploading && onInsertAsset(asset)}
    >
      {/* Image thumbnail */}
      <div
        style={{
          width: '100%',
          height: '200px',
          backgroundImage: getThumbnailUrl(asset) ? `url(${getThumbnailUrl(asset)})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: getThumbnailUrl(asset) ? 'transparent' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
          if (overlay) overlay.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLElement;
          if (overlay) overlay.style.opacity = '0';
        }}
      >
        {!getThumbnailUrl(asset) && !(progress || progressOriginal) && (
          <Text size="small" tone="tertiary">
            No Preview Available
          </Text>
        )}
        {/* Upload progress overlay */}
        {(progress || progressOriginal) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: 10
          }}>
            {(() => {
              const currentProgress = progressOriginal || progress;
              if (!currentProgress) return null;
              return (
                <>
                  <div style={{ marginBottom: '8px' }}>
                    {currentProgress.status === 'failed' ? '❌' : currentProgress.status === 'completed' ? '✅' : '⏳'}
                  </div>
                  <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                    {currentProgress.message}
                  </div>
                  {currentProgress.status !== 'failed' && currentProgress.status !== 'completed' && (
                    <div style={{
                      width: '80%',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${currentProgress.progress}%`,
                        height: '100%',
                        backgroundColor: '#4ade80',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {/* Hover overlay */}
        {!progress && !progressOriginal && (
          <div
            className="hover-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.2s ease',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Click to Insert
          </div>
        )}
      </div>

      {/* Asset details */}
      <div style={{ padding: '16px' }}>
        <div style={{
          fontWeight: '500',
          marginBottom: '4px',
          fontSize: '16px',
          color: '#1f2937'
        }}>
          {asset.name}
        </div>
        {asset.slug && (
          <div style={{
            marginBottom: '4px',
            padding: '4px 8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#6b7280',
            display: 'inline-block'
          }}>
            {asset.slug}
          </div>
        )}

        <Text size="small" tone="secondary">
          {(progress || progressOriginal) ? (progressOriginal || progress)?.message || 'Processing...' : 'Click thumbnail to insert'}
        </Text>

        {/* Add Page and Insert button */}
        {!isUploading && (
          <div style={{ marginTop: '12px' }}>
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onInsertOriginal(asset);
              }}
              disabled={isUploading}
            >
              Add Page and Insert
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}