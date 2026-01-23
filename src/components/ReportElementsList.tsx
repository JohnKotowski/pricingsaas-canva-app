import { Box, Rows, Text, TextInput, Columns, Column } from "@canva/app-ui-kit";
import { ReportElement } from "../types";
import { useState, useMemo } from "react";

interface ReportElementsListProps {
  elements: ReportElement[];
  onSelectElement: (element: ReportElement, index: number, mode?: 'insert' | 'add') => void;
  importingElementId?: string | null;
}

type FilterType = 'all' | 'title' | 'text' | 'section_header' | 'example' | 'graph' | 'list' | 'tiles' | 'tags' | 'example_table';

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

    // Special handling for tables - show the table title and row info
    if (element.type === 'example_table') {
      const config = parsed.config || parsed;
      const rows = config.rows || [];
      const title = config.title || 'Table';

      if (rows.length > 0) {
        const firstCompany = rows[0].companyName || rows[0].company || '';
        if (firstCompany) {
          if (rows.length > 1) {
            return `${title} - ${firstCompany} & ${rows.length - 1} more`;
          } else {
            return `${title} - ${firstCompany}`;
          }
        }
      }
      return title;
    }

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");

  // Define available filter options
  const filterOptions: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: 'All', icon: '📑' },
    { value: 'example', label: 'Examples', icon: '🖼️' },
    { value: 'example_table', label: 'Tables', icon: '📊' },
    { value: 'graph', label: 'Graphs', icon: '📊' },
    { value: 'tiles', label: 'Metrics', icon: '🎨' },
    { value: 'title', label: 'Titles', icon: '📄' },
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'section_header', label: 'Sections', icon: '🔖' },
  ];

  // Filter and search elements
  const filteredElements = useMemo(() => {
    let filtered = elements;

    // Apply type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(element => element.type === selectedFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(element => {
        const title = getElementTitle(element).toLowerCase();
        const typeName = getElementTypeName(element.type).toLowerCase();
        return title.includes(query) || typeName.includes(query);
      });
    }

    return filtered;
  }, [elements, selectedFilter, searchQuery]);

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
        {/* Search Bar */}
        <Box paddingTop="2u">
          <TextInput
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
          />
        </Box>

        {/* Filter Chips */}
        <Box paddingY="1u">
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                style={{
                  padding: '6px 12px',
                  border: selectedFilter === option.value ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  borderRadius: '16px',
                  backgroundColor: selectedFilter === option.value ? '#eff6ff' : '#ffffff',
                  color: selectedFilter === option.value ? '#1e40af' : '#4b5563',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  if (selectedFilter !== option.value) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFilter !== option.value) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </Box>

        {/* Results count */}
        {(searchQuery.trim() || selectedFilter !== 'all') && (
          <Box paddingY="1u">
            <Text size="small" tone="secondary">
              {filteredElements.length} {filteredElements.length === 1 ? 'page' : 'pages'} found
            </Text>
          </Box>
        )}

        {/* Elements List */}
        {filteredElements.length === 0 ? (
          <Box paddingY="6u">
            <Text tone="secondary">
              No pages match your search or filter.
            </Text>
          </Box>
        ) : (
          filteredElements.map((element, index) => {
            const isImporting = importingElementId === element.id;
            const originalIndex = elements.indexOf(element);

            const isExample = element.type === 'example';

            return (
              <div
                key={element.id || originalIndex}
                onClick={() => !isImporting && !isExample && onSelectElement(element, originalIndex)}
                style={{
                  width: '100%',
                  height: 'auto',
                  padding: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  cursor: isImporting ? 'wait' : (isExample ? 'default' : 'pointer'),
                  backgroundColor: isImporting ? '#f9fafb' : '#ffffff',
                  opacity: isImporting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isImporting && !isExample) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isImporting && !isExample) {
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
                        Slide {originalIndex + 1}
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
                    {isExample && !isImporting && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(element, originalIndex, 'insert');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            border: '2px solid #3b82f6',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            color: '#3b82f6',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }}
                        >
                          Insert
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectElement(element, originalIndex, 'add');
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            border: '2px solid #3b82f6',
                            borderRadius: '6px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#3b82f6';
                          }}
                        >
                          Add
                        </button>
                      </div>
                    )}
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
          })
        )}
      </Rows>
    </Box>
  );
}
