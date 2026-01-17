/**
 * TemplateEditorView Component
 * Allows editing template element classification (static/dynamic toggle)
 * Users can manually override auto-classification from the scanner
 */

import { Button, Rows, Text, Box, FormField, TextInput } from "@canva/app-ui-kit";
import { useState } from "react";
import type { PageConfig, TemplateElement } from "../types";
import * as styles from "./TemplateEditorView.css";

interface TemplateEditorViewProps {
  config: PageConfig;
  onSave: (name: string, description: string, updated: PageConfig) => void;
  onCancel: () => void;
}

export function TemplateEditorView({ config, onSave, onCancel }: TemplateEditorViewProps) {
  const [elements, setElements] = useState<TemplateElement[]>(config.elements);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const toggleElementMode = (elementId: string) => {
    setElements(prev =>
      prev.map(elem =>
        elem.id === elementId
          ? { ...elem, elementMode: elem.elementMode === 'static' ? 'dynamic' : 'static' }
          : elem
      )
    );
  };

  const handleSave = () => {
    console.log('[TemplateEditorView] Save button clicked, templateName:', templateName);

    if (!templateName.trim()) {
      console.log('[TemplateEditorView] Validation failed: name is empty');
      setNameError('Template name is required');
      return;
    }

    console.log('[TemplateEditorView] Validation passed, calling onSave with', elements.length, 'elements');
    setNameError('');
    onSave(templateName, templateDescription, {
      ...config,
      elements,
    });
  };

  return (
    <Box paddingX="3u" paddingY="3u">
      <Rows spacing="3u">
        <div>
          <Text>Save Template</Text>
          <Text size="small" tone="secondary">
            Configure element classification and provide template details.
          </Text>
        </div>

        {/* Template Name and Description */}
        <Rows spacing="2u">
          {nameError && (
            <Box paddingX="2u" paddingY="1u" borderRadius="standard">
              <Text tone="critical">{nameError}</Text>
            </Box>
          )}
          <FormField
            label="Template Name"
            description="Required - Give your template a descriptive name"
            value={templateName}
            control={(props) => (
              <TextInput
                placeholder="e.g., Monthly Report Template"
                onChange={(val) => {
                  console.log('[TemplateEditorView] Name input changed to:', val);
                  setTemplateName(val);
                  if (nameError) setNameError(''); // Clear error on input
                }}
              />
            )}
          />
          <FormField
            label="Description"
            description="Optional - Describe what this template is used for"
            value={templateDescription}
            control={(props) => (
              <TextInput
                placeholder="e.g., Template for monthly performance reports"
                onChange={(val) => {
                  console.log('[TemplateEditorView] Description input changed to:', val);
                  setTemplateDescription(val);
                }}
              />
            )}
          />
        </Rows>

        <div>
          <Text>Element Classification</Text>
          <Text size="small" tone="secondary">
            Static elements (logos, backgrounds) are always recreated exactly.
            Dynamic elements (titles, content) are populated with data when generating pages.
          </Text>
        </div>

        <Rows spacing="2u">
          {elements.map((elem) => {
            const isStatic = elem.elementMode === 'static';
            const previewText = elem.type === 'text'
              ? elem.text?.plaintext?.substring(0, 50)
              : `${elem.type.toUpperCase()} at (${Math.round(elem.top)}, ${Math.round(elem.left)})`;

            return (
              <Box
                key={elem.id}
                paddingX="2u"
                paddingY="2u"
                borderRadius="standard"
                className={styles.elementItem}
              >
                <Rows spacing="1u">
                  <div className={styles.elementHeader}>
                    <Text size="small">
                      {elem.type.toUpperCase()}
                    </Text>
                    <Box
                      className={`${styles.badge} ${isStatic ? styles.badgeStatic : styles.badgeDynamic}`}
                    >
                      <Text size="xsmall">
                        {isStatic ? 'STATIC' : 'DYNAMIC'}
                      </Text>
                    </Box>
                  </div>

                  {elem.type === 'text' && (
                    <Text size="small" tone="secondary">
                      "{previewText || ''}"
                    </Text>
                  )}

                  <Box className={styles.toggleSection}>
                    <Button
                      variant={isStatic ? 'primary' : 'secondary'}
                      onClick={() => {
                        if (!isStatic) toggleElementMode(elem.id);
                      }}
                    >
                      Static
                    </Button>
                    <Button
                      variant={!isStatic ? 'primary' : 'secondary'}
                      onClick={() => {
                        if (isStatic) toggleElementMode(elem.id);
                      }}
                    >
                      Dynamic
                    </Button>
                  </Box>

                  {elem.tokens && elem.tokens.length > 0 && (
                    <Text size="xsmall" tone="tertiary">
                      Tokens: {elem.tokens.join(', ')}
                    </Text>
                  )}
                </Rows>
              </Box>
            );
          })}
        </Rows>

        <Box className={styles.actionButtons}>
          <Button variant="primary" onClick={handleSave}>
            Save Template
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </Box>
      </Rows>
    </Box>
  );
}
