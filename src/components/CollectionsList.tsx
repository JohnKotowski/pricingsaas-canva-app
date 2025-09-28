import { Box, Rows, Text } from "@canva/app-ui-kit";
import { Collection } from "../types";

interface CollectionsListProps {
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
}

function formatCollectionName(name: string, maxWidth: number = 25): string {
  if (name.length <= maxWidth) {
    return name + '.'.repeat(maxWidth - name.length);
  } else {
    return name.substring(0, maxWidth - 3) + '...';
  }
}

export function CollectionsList({ collections, onSelectCollection }: CollectionsListProps) {
  if (collections.length === 0) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Text tone="secondary">
          No collections found. Make sure your database has collections in the app_collections table.
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX="3u">
      <Rows spacing="2u">
        {collections.map((collection) => (
          <div
            key={collection.id}
            onClick={() => onSelectCollection(collection)}
            style={{
              width: '100%',
              height: 'auto',
              padding: '16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              justifyContent: 'flex-start',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '16px', lineHeight: '1', marginTop: '2px' }}>
                📁
              </span>
              <span>
                <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {formatCollectionName(collection.name)}
                </div>
                {collection.description && (
                  <div style={{ marginTop: '4px' }}>
                    <Text size="small" tone="secondary">
                      {collection.description}
                    </Text>
                  </div>
                )}
              </span>
            </span>
          </div>
        ))}
      </Rows>
    </Box>
  );
}