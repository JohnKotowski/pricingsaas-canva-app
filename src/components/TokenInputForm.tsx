/**
 * TokenInputForm Component
 * Form to collect token values for page generation
 * Shows all defined tokens from the template with their labels and types
 */

import { Button, FormField, TextInput, Rows, Text } from "@canva/app-ui-kit";
import { useState } from "react";
import type { TokenDefinition, TokenValues } from "../types";

interface TokenInputFormProps {
  tokenDefinitions: Record<string, TokenDefinition>;
  onSubmit: (values: TokenValues) => void;
  onCancel: () => void;
}

export function TokenInputForm({ tokenDefinitions, onSubmit, onCancel }: TokenInputFormProps) {
  const [values, setValues] = useState<TokenValues>(() => {
    const initial: TokenValues = {};
    Object.entries(tokenDefinitions).forEach(([name, def]) => {
      initial[name] = def.default || '';
    });
    return initial;
  });

  const handleSubmit = () => {
    onSubmit(values);
  };

  const tokenCount = Object.keys(tokenDefinitions).length;

  return (
    <Rows spacing="3u">
      <div>
        <Text>Fill in template values:</Text>
        <Text size="small" tone="secondary">
          {tokenCount} {tokenCount === 1 ? 'field' : 'fields'} to configure
        </Text>
      </div>

      {Object.entries(tokenDefinitions).map(([name, def]) => {
        const isImageUrl = def.type === 'image_url' || def.type === 'video_url';
        const placeholder = def.default?.toString() || (isImageUrl ? 'https://example.com/image.jpg' : '');

        return (
          <FormField
            key={name}
            label={def.label}
            description={def.description || (def.required ? 'Required' : 'Optional')}
            value={values[name]?.toString() || ''}
            control={(props) => (
              <TextInput
                {...props}
                onChange={(val) => setValues(prev => ({ ...prev, [name]: val }))}
                placeholder={placeholder}
              />
            )}
          />
        );
      })}

      <Rows spacing="2u">
        <Button variant="primary" onClick={handleSubmit}>
          Create Page
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </Rows>

      <Text size="small" tone="tertiary">
        Dynamic elements without values will be skipped. Static elements (logos, backgrounds) will be added automatically.
      </Text>
    </Rows>
  );
}
