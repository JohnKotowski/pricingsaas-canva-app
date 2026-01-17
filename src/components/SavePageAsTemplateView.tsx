/**
 * SavePageAsTemplateView Component
 * Allows user to save the current page as a template
 * Note: User must navigate to the desired page before clicking save
 */

import { Button, Rows, Text, Box } from "@canva/app-ui-kit";
import { useState } from "react";
import { TemplateScanner } from "../services/templateScanner";
import type { PageConfig } from "../types";

interface SavePageAsTemplateViewProps {
  onScanComplete: (config: PageConfig) => void;
  onError: (error: string) => void;
}

export function SavePageAsTemplateView({ onScanComplete, onError }: SavePageAsTemplateViewProps) {
  const [scanning, setScanning] = useState(false);

  const handleSaveCurrentPage = async () => {
    try {
      setScanning(true);
      const scanner = new TemplateScanner();
      const config = await scanner.scanCurrentPageAsTemplate();
      onScanComplete(config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan page';
      onError(errorMessage);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Box paddingX="3u" paddingY="3u">
      <Rows spacing="3u">
        <Text>Save Current Page as Template</Text>
        <Text size="small" tone="secondary">
          This will scan all elements on the current page and create a reusable template.
          Navigate to the page you want to save before clicking the button below.
        </Text>

        <Button
          variant="primary"
          onClick={handleSaveCurrentPage}
          loading={scanning}
        >
          Save Current Page as Template
        </Button>

        <Text size="small" tone="tertiary">
          Tip: Text containing {`{{token}}`} placeholders will be automatically marked as dynamic elements.
        </Text>
      </Rows>
    </Box>
  );
}
