import { Box, Rows, Text } from "@canva/app-ui-kit";
import { Report } from "../types";

interface ReportsListProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

function formatReportName(name: string, maxWidth: number = 25): string {
  if (name.length <= maxWidth) {
    return name + '.'.repeat(maxWidth - name.length);
  } else {
    return name.substring(0, maxWidth - 3) + '...';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export function ReportsList({ reports, onSelectReport }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Text tone="secondary">
          No reports found. Make sure your database has reports in the app_saved_reports table.
        </Text>
      </Box>
    );
  }

  return (
    <Box paddingX="3u">
      <Rows spacing="2u">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => onSelectReport(report)}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '16px', lineHeight: '1', marginTop: '2px' }}>
                📊
              </span>
              <span style={{ flex: 1 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {formatReportName(report.name)}
                </div>
                {report.description && (
                  <div style={{ marginTop: '4px' }}>
                    <Text size="small" tone="secondary">
                      {report.description}
                    </Text>
                  </div>
                )}
                <div style={{
                  marginTop: '8px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {report.element_count || report.elements.length} slides
                  </span>
                  {report.created_at && (
                    <Text size="small" tone="tertiary">
                      {formatDate(report.created_at)}
                    </Text>
                  )}
                </div>
              </span>
            </span>
          </div>
        ))}
      </Rows>
    </Box>
  );
}
