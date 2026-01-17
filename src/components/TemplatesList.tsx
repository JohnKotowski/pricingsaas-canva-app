/**
 * TemplatesList Component
 * Displays all available templates with preview and selection
 */

import { Box, Rows, Text, Button } from "@canva/app-ui-kit";
import type { TemplatePage } from "../types";
import * as styles from "./TemplatesList.css";

interface TemplatesListProps {
  templates: TemplatePage[];
  onSelectTemplate: (template: TemplatePage) => void;
  onEditTemplate?: (template: TemplatePage) => void;
  loading?: boolean;
}

export function TemplatesList({
  templates,
  onSelectTemplate,
  onEditTemplate,
  loading,
}: TemplatesListProps) {
  if (loading) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Text>Loading templates...</Text>
      </Box>
    );
  }

  if (templates.length === 0) {
    return (
      <Box paddingX="3u" paddingY="6u">
        <Rows spacing="2u">
          <Text tone="secondary">No templates available.</Text>
          <Text size="small" tone="tertiary">
            Scan a page from your design to create your first template.
          </Text>
        </Rows>
      </Box>
    );
  }

  return (
    <Box paddingX="3u" paddingY="2u">
      <Rows spacing="2u">
        {templates.map((template) => {
          const elementCount = template.page_config?.elements?.length || 0;
          const tokenCount = Object.keys(template.page_config?.tokenDefinitions || {}).length;

          return (
            <Box
              key={template.id}
              className={styles.templateCard}
              paddingX="2u"
              paddingY="2u"
              borderRadius="standard"
            >
              <Rows spacing="1u">
                {template.preview_image_url && (
                  <img
                    src={template.preview_image_url}
                    alt={template.name}
                    className={styles.templatePreview}
                  />
                )}

                <Text>{template.name}</Text>

                {template.description && (
                  <Text size="small" tone="secondary">
                    {template.description}
                  </Text>
                )}

                <Box className={styles.templateMeta}>
                  <Text size="xsmall" tone="tertiary">
                    {elementCount} {elementCount === 1 ? 'element' : 'elements'}
                  </Text>
                  <Text size="xsmall" tone="tertiary">
                    •
                  </Text>
                  <Text size="xsmall" tone="tertiary">
                    {tokenCount} {tokenCount === 1 ? 'token' : 'tokens'}
                  </Text>
                </Box>

                <Box className={styles.templateActions}>
                  <Button
                    variant="primary"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                  {onEditTemplate && (
                    <Button
                      variant="secondary"
                      onClick={() => onEditTemplate(template)}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </Rows>
            </Box>
          );
        })}
      </Rows>
    </Box>
  );
}
