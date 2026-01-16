import { Box, Rows, Text, Button } from "@canva/app-ui-kit";
import * as styles from "../index.css";
import { SizePreset } from "../types";

interface SizeSelectionProps {
  selectedPreset: SizePreset;
  setSelectedPreset: (preset: SizePreset) => void;
  customWidth: number;
  setCustomWidth: (width: number) => void;
  customHeight: number;
  setCustomHeight: (height: number) => void;
  onContinue: (preset?: SizePreset) => void;
}

export function SizeSelection({
  selectedPreset,
  setSelectedPreset,
  customWidth,
  setCustomWidth,
  customHeight,
  setCustomHeight,
  onContinue
}: SizeSelectionProps) {
  return (
    <div className={styles.rootWrapper}>
      <Box paddingX="4u" paddingY="4u">
        <div style={{ maxWidth: '100%', width: '100%' }}>
          <Rows spacing="4u">
            {/* Header */}
            <Box>
              <Text size="large">
                Choose Design Size
              </Text>
              <Text size="medium" tone="secondary">
                Select the dimensions for your design
              </Text>
            </Box>

            {/* Size preset options */}
            <Rows spacing="2u">
              {/* 1:1 Square option */}
              <div
                onClick={() => {
                  setSelectedPreset('1:1');
                  onContinue('1:1');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: selectedPreset === '1:1' ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: selectedPreset === '1:1' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Rows spacing="0.5u">
                  <Text size="medium">1:1 Square</Text>
                  <Text size="small" tone="secondary">1080 × 1080 pixels</Text>
                  <Text size="small" tone="tertiary">Perfect for social media posts</Text>
                </Rows>
              </div>

              {/* 16:9 Landscape option */}
              <div
                onClick={() => {
                  setSelectedPreset('16:9');
                  onContinue('16:9');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: selectedPreset === '16:9' ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: selectedPreset === '16:9' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Rows spacing="0.5u">
                  <Text size="medium">16:9 Landscape</Text>
                  <Text size="small" tone="secondary">1920 × 1080 pixels</Text>
                  <Text size="small" tone="tertiary">Great for presentations and headers</Text>
                </Rows>
              </div>

              {/* 816x1056 Portrait option */}
              <div
                onClick={() => {
                  setSelectedPreset('816x1056');
                  onContinue('816x1056');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: selectedPreset === '816x1056' ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: selectedPreset === '816x1056' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Rows spacing="0.5u">
                  <Text size="medium">816 × 1056 Portrait</Text>
                  <Text size="small" tone="secondary">816 × 1056 pixels</Text>
                  <Text size="small" tone="tertiary">Optimized for vertical content</Text>
                </Rows>
              </div>

              {/* Custom option */}
              <div
                onClick={() => setSelectedPreset('custom')}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: selectedPreset === 'custom' ? '2px solid #6366f1' : '2px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: selectedPreset === 'custom' ? '#f0f9ff' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Rows spacing="0.5u">
                  <Text size="medium">Custom Size</Text>
                  <Text size="small" tone="secondary">Enter your own dimensions</Text>
                </Rows>
              </div>

              {/* Custom size inputs */}
              {selectedPreset === 'custom' && (
                <Box paddingX="2u">
                  <Rows spacing="2u">
                    <Box>
                      <div style={{ marginBottom: '4px' }}>
                        <Text size="small" tone="secondary">Width (px)</Text>
                      </div>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value) || 1080)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                        min="100"
                        max="3000"
                      />
                    </Box>
                    <Box>
                      <div style={{ marginBottom: '4px' }}>
                        <Text size="small" tone="secondary">Height (px)</Text>
                      </div>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value) || 1080)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                        min="100"
                        max="3000"
                      />
                    </Box>
                  </Rows>
                </Box>
              )}
            </Rows>

            {/* Confirm button - only show for custom size */}
            {selectedPreset === 'custom' && (
              <Button
                variant="primary"
                onClick={() => onContinue('custom')}
              >
                Continue with Custom Size
              </Button>
            )}
          </Rows>
        </div>
      </Box>
    </div>
  );
}