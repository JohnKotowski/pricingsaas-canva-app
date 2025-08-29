#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function introspectDatabase() {
  console.log('🔍 Introspecting Supabase database schema...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const schemaInfo = {
    generatedAt: new Date().toISOString(),
    supabaseUrl: supabaseUrl,
    tables: {},
    summary: {
      totalTables: 0,
      totalColumns: 0,
      accessibleTables: []
    }
  };

  // List of common table names to check
  const commonTables = [
    'users', 'profiles', 'posts', 'comments', 'categories', 'tags',
    'images', 'files', 'media', 'assets', 'collections', 'app_collections', 'app_assets',
    'projects', 'workspaces', 'teams', 'organizations', 'permissions',
    'roles', 'sessions', 'notifications', 'settings', 'config',
    'analytics', 'logs', 'audits', 'backups'
  ];

  console.log('🔍 Checking for accessible tables...');

  for (const tableName of commonTables) {
    try {
      // Try to access the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error) {
        console.log(`✅ Found table: ${tableName}`);
        schemaInfo.summary.accessibleTables.push(tableName);

        // Get table info and sample data
        const { data: allData, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(3);

        const tableInfo = {
          name: tableName,
          recordCount: count || 0,
          columns: [],
          sampleData: allData || []
        };

        // Extract column information from sample data
        if (allData && allData.length > 0) {
          const sampleRecord = allData[0];
          Object.keys(sampleRecord).forEach(columnName => {
            const value = sampleRecord[columnName];
            let columnType = 'unknown';
            
            if (value === null) {
              columnType = 'nullable';
            } else if (typeof value === 'string') {
              if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                columnType = 'timestamp';
              } else if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                columnType = 'uuid';
              } else if (value.startsWith('http')) {
                columnType = 'url';
              } else {
                columnType = 'text';
              }
            } else if (typeof value === 'number') {
              columnType = Number.isInteger(value) ? 'integer' : 'decimal';
            } else if (typeof value === 'boolean') {
              columnType = 'boolean';
            } else if (Array.isArray(value)) {
              columnType = 'array';
            } else if (typeof value === 'object') {
              columnType = 'json';
            }

            tableInfo.columns.push({
              name: columnName,
              inferredType: columnType,
              sampleValue: value
            });
          });
          
          schemaInfo.summary.totalColumns += tableInfo.columns.length;
        }

        schemaInfo.tables[tableName] = tableInfo;
        schemaInfo.summary.totalTables++;
      }
    } catch (e) {
      // Table doesn't exist or no access - skip silently
    }
  }

  // Generate schema documentation
  const schemaDoc = generateSchemaDocument(schemaInfo);

  // Save to files
  const schemaPath = path.join(__dirname, 'database-schema.json');
  const docPath = path.join(__dirname, 'DATABASE_SCHEMA.md');

  fs.writeFileSync(schemaPath, JSON.stringify(schemaInfo, null, 2));
  fs.writeFileSync(docPath, schemaDoc);

  console.log('\n📊 Database Introspection Complete!');
  console.log(`📋 Total accessible tables: ${schemaInfo.summary.totalTables}`);
  console.log(`📋 Total columns: ${schemaInfo.summary.totalColumns}`);
  console.log(`📄 Schema saved to: ${schemaPath}`);
  console.log(`📖 Documentation saved to: ${docPath}`);
  console.log('\n✨ You can now reference these files in your prompts to LLMs!');
}

function generateSchemaDocument(schemaInfo) {
  let doc = `# Database Schema Documentation\n\n`;
  doc += `**Generated:** ${schemaInfo.generatedAt}\n`;
  doc += `**Database:** ${schemaInfo.supabaseUrl}\n\n`;
  
  doc += `## Summary\n\n`;
  doc += `- **Total Tables:** ${schemaInfo.summary.totalTables}\n`;
  doc += `- **Total Columns:** ${schemaInfo.summary.totalColumns}\n`;
  doc += `- **Accessible Tables:** ${schemaInfo.summary.accessibleTables.join(', ')}\n\n`;

  doc += `## Tables\n\n`;

  Object.values(schemaInfo.tables).forEach(table => {
    doc += `### ${table.name}\n\n`;
    doc += `**Record Count:** ${table.recordCount}\n\n`;
    
    if (table.columns.length > 0) {
      doc += `**Columns:**\n\n`;
      doc += `| Column | Type | Sample Value |\n`;
      doc += `|--------|------|-------------|\n`;
      
      table.columns.forEach(col => {
        const sampleValue = col.sampleValue === null ? 'null' : 
                           typeof col.sampleValue === 'string' ? `"${col.sampleValue.substring(0, 50)}"` :
                           JSON.stringify(col.sampleValue).substring(0, 50);
        doc += `| ${col.name} | ${col.inferredType} | ${sampleValue} |\n`;
      });
      doc += `\n`;
    }

    if (table.sampleData.length > 0) {
      doc += `**Sample Data:**\n\n`;
      doc += `\`\`\`json\n${JSON.stringify(table.sampleData[0], null, 2)}\n\`\`\`\n\n`;
    }

    doc += `---\n\n`;
  });

  return doc;
}

// Run the introspection
introspectDatabase().catch(console.error);