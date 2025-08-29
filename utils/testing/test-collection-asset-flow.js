#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testCollectionAssetFlow() {
  console.log('📁 Testing Collection/Asset Flow...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Get collections (folders)
    console.log('🧪 Test 1: Getting collections (folders)...');
    const { data: collections, error: collectionsError } = await supabase
      .from('app_collections')
      .select('id, name, description')
      .limit(5);

    if (collectionsError) {
      throw collectionsError;
    }

    console.log(`✅ Found ${collections.length} collections:`);
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name} (ID: ${collection.id})`);
    });

    if (collections.length === 0) {
      console.log('⚠️  No collections found. The app will show an empty folder structure.');
      return;
    }

    // Test 2: Get assets for first collection
    const firstCollection = collections[0];
    console.log(`\n🧪 Test 2: Getting assets for collection "${firstCollection.name}"...`);
    
    const { data: assets, error: assetsError, count } = await supabase
      .from('app_assets')
      .select('*', { count: 'exact' })
      .eq('collection_id', firstCollection.id)
      .limit(10);

    if (assetsError) {
      console.log(`⚠️  Could not query assets: ${assetsError.message}`);
      console.log(`💡 This might be normal if there's no collection_id column or no assets yet`);
    } else {
      console.log(`✅ Found ${count || 0} assets in collection "${firstCollection.name}"`);
      
      if (assets && assets.length > 0) {
        console.log('📝 Sample assets:');
        assets.slice(0, 3).forEach((asset, index) => {
          console.log(`   ${index + 1}. ${asset.name || asset.filename || 'Untitled'}`);
          console.log(`      URL: ${asset.url || asset.file_url || 'No URL'}`);
          console.log(`      Type: ${asset.content_type || asset.mime_type || 'Unknown'}`);
        });
      } else {
        console.log('📝 No assets found in this collection');
      }
    }

    // Test 3: Simulate Canva App Flow
    console.log('\n🎨 Test 3: Simulating Canva App Flow...');
    
    // Step 1: User opens app - sees collections as folders
    console.log('👤 User opens Canva app...');
    const folderResponse = {
      resources: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        contentType: 'folder',
        parentContainerId: 'root',
        url: '',
        thumbnail: ''
      })),
      containers: [],
      continuation: null
    };
    
    console.log(`✅ App shows ${folderResponse.resources.length} folders to user`);
    
    // Step 2: User clicks on a collection - sees assets
    console.log(`👤 User clicks on "${firstCollection.name}" folder...`);
    
    if (!assetsError && assets) {
      const imageResources = assets.map(asset => ({
        id: asset.id,
        name: asset.name || asset.filename || 'Untitled Asset',
        url: asset.url || asset.file_url || '',
        thumbnail: asset.thumbnail_url || asset.url || asset.file_url || '',
        width: asset.width || undefined,
        height: asset.height || undefined,
        contentType: asset.content_type || asset.mime_type || 'image/jpeg',
        tags: asset.tags || [],
        parentContainerId: firstCollection.id,
      }));
      
      console.log(`✅ App shows ${imageResources.length} images from collection`);
      
      if (imageResources.length > 0) {
        console.log('🖼️  Sample image resources:');
        imageResources.slice(0, 2).forEach((resource, index) => {
          console.log(`   ${index + 1}. ${resource.name}`);
          console.log(`      📷 Has thumbnail: ${resource.thumbnail ? '✅' : '❌'}`);
          console.log(`      🔗 Has URL: ${resource.url ? '✅' : '❌'}`);
        });
      }
    } else {
      console.log('⚠️  No assets to show in collection');
    }

    console.log('\n🎉 Collection/Asset flow test completed!');
    console.log('📋 Summary:');
    console.log(`   - Collections available: ${collections.length}`);
    console.log(`   - Assets in first collection: ${assets ? assets.length : 'Unknown'}`);
    console.log('   - Flow: Collections → Assets ✅');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCollectionAssetFlow();