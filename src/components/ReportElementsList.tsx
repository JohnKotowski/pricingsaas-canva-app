import { Box, Rows, Text } from "@canva/app-ui-kit";
import { ReportElement } from "../types";

interface ReportElementsListProps {
  elements: ReportElement[];
  onSelectElement: (element: ReportElement, index: number) => void;
  importingElementId?: string | null;
}

function getElementIcon(type: string): string {
  switch (type) {
    case 'title':
      return '📄';
    case 'text':
      return '📝';
    case 'section_header':
      return '🔖';
    case 'example':
      return '🖼️';
    case 'graph':
      return '📊';
    case 'list':
      return '📋';
    case 'tiles':
      return '🎨';
    case 'tags':
      return '🏷️';
    case 'example_table':
      return '📊';
    default:
      return '📄';
  }
}

function getElementTitle(element: ReportElement): string {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(element.content);

    // Special handling for tiles - show the metrics
    if (element.type === 'tiles') {
      const config = parsed.config || parsed;
      const tiles = config.tiles || [];
      if (tiles.length > 0) {
        const metrics = tiles.map((t: any) => {
          const metric = t.metric || t.name || 'metric';
          // Format: "total_companies" -> "Total Companies"
          return metric.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        });
        return metrics.slice(0, 3).join(', ') + (metrics.length > 3 ? `, +${metrics.length - 3} more` : '');
      }
      return config.title || 'Metrics';
    }

    const text = parsed.text || parsed.title || parsed.config?.caption || '';
    // Truncate to 60 chars
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  } catch {
    // If not JSON, use the content directly (remove quotes if present)
    const text = element.content.replace(/^["']|["']$/g, '');
    // Truncate to 60 chars
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  }
}

function getElementTypeName(type: string): string {
  switch (type) {
    case 'title':
      return 'Title';
    case 'text':
      return 'Text';
    case 'section_header':
      return 'Section Header';
    case 'example':
      return 'Example (Before/After)';
    case 'tiles':
      return 'Metric Tiles';
    case 'graph':
      return 'Chart';
    case 'list':
      return 'List (placeholder)';
    case 'tags':
      return 'Tags (placeholder)';
    case 'example_table':
      return 'Table';
    default:
      return type;
  }
}

export function ReportElementsList({ elements, onSelectElement, importingElementId }: ReportElementsListProps) {
  if (elements.length === 0) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Text tone="secondary">
          This report has no elements.
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX="3u">
      <Rows spacing="2u">
        {elements.map((element, index) => {
          const isImporting = importingElementId === element.id;

          return (
            <div
              key={element.id || index}
              onClick={() => !isImporting && onSelectElement(element, index)}
              style={{
                width: '100%',
                height: 'auto',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                cursor: isImporting ? 'wait' : 'pointer',
                backgroundColor: isImporting ? '#f9fafb' : '#ffffff',
                opacity: isImporting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isImporting) {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isImporting) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '24px', lineHeight: '1', marginTop: '2px' }}>
                  {getElementIcon(element.type)}
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Slide {index + 1}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {getElementTypeName(element.type)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#111827',
                    lineHeight: '1.5',
                    marginTop: '6px'
                  }}>
                    {getElementTitle(element)}
                  </div>
                  {isImporting && (
                    <div style={{ marginTop: '8px' }}>
                      <Text size="small" tone="tertiary">
                        Creating slide...
                      </Text>
                    </div>
                  )}
                </span>
              </span>
            </div>
          );
        })}
      </Rows>
    </Box>
  );
}
