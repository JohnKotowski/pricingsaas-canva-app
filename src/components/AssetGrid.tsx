import { Box, Text } from "@canva/app-ui-kit";
import { AssetCard } from "./AssetCard";
import { Asset, UploadProgress } from "../types";

interface AssetGridProps {
  assets: Asset[];
  filteredAssets: Asset[];
  slugFilter: string;
  setSlugFilter: (filter: string) => void;
  uploadProgress: Map<string, UploadProgress>;
  onInsertAsset: (asset: Asset) => void;
  onInsertOriginal: (asset: Asset) => void;
  getThumbnailUrl: (asset: Asset) => string | null;
}

export function AssetGrid({
  assets,
  filteredAssets,
  slugFilter,
  setSlugFilter,
  uploadProgress,
  onInsertAsset,
  onInsertOriginal,
  getThumbnailUrl
}: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Text tone="secondary">
          {slugFilter
            ? `No assets found matching "${slugFilter}" in this collection.`
            : "No assets found in this collection."
          }
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX="4u" paddingY="3u">
      {/* Slug Filter Bar */}
      <Box paddingBottom="3u">
        <div style={{ marginBottom: '8px' }}>
          <Text size="small" tone="secondary">Filter by slug</Text>
        </div>
        <div style={{ maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="Type to filter assets by slug..."
            value={slugFilter}
            onChange={(e) => setSlugFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
          />
        </div>
        {slugFilter && (
          <div style={{ marginTop: '8px' }}>
            <Text size="small" tone="tertiary">
              Showing {filteredAssets.length} of {assets.length} assets
            </Text>
          </div>
        )}
      </Box>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        padding: '16px 0'
      }}>
        {filteredAssets.map((asset) => {
          const progress = uploadProgress.get(asset.id);
          const progressOriginal = uploadProgress.get(`${asset.id}-original`);

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              progress={progress}
              progressOriginal={progressOriginal}
              onInsertAsset={onInsertAsset}
              onInsertOriginal={onInsertOriginal}
              getThumbnailUrl={getThumbnailUrl}
            />
          );
        })}
      </div>
    </Box>
  );
}