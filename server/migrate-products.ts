import { storage } from "./storage";

/**
 * Migration script to backfill products table from existing documents
 * Run this once after deploying the product schema to extract all products
 * from existing document structuredData into the new products/productVariants tables
 */
async function migrateProducts() {
  console.log("Starting product migration...");
  
  try {
    const documents = await storage.getAllDocuments();
    console.log(`Found ${documents.length} documents to process`);
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const document of documents) {
      if (!document.structuredData) {
        console.log(`Skipping document ${document.id} - no structured data`);
        skippedCount++;
        continue;
      }
      
      try {
        await storage.projectProductsFromDocument(document.id);
        processedCount++;
        console.log(`✓ Processed document ${document.name} (${processedCount}/${documents.length})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error processing document ${document.name}:`, error);
      }
    }
    
    console.log("\nMigration complete!");
    console.log(`Processed: ${processedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    // Show summary of created products
    const allProducts = await storage.getAllProducts();
    console.log(`\nTotal products created: ${allProducts.length}`);
    
    for (const product of allProducts) {
      const variants = await storage.getProductVariants(product.id);
      const locales = [...new Set(variants.map(v => v.locale).filter(Boolean))];
      console.log(`  - ${product.name}: ${variants.length} variants across ${locales.length} locales (${locales.join(", ")})`);
    }
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateProducts();
