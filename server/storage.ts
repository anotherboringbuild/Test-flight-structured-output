import { type Document, type InsertDocument, type Folder, type InsertFolder, type DocumentVersion, type InsertDocumentVersion, type Product, type InsertProduct, type ProductVariant, type InsertProductVariant } from "@shared/schema";
import { db } from "./db";
import { documents, folders, documentVersions, products, productVariants } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByFolder(folderId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<void>;
  
  // Folders
  getFolder(id: string): Promise<Folder | undefined>;
  getAllFolders(): Promise<Folder[]>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<void>;
  
  // Document Versions
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  getLatestVersionNumber(documentId: string): Promise<number>;
  
  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getProductByName(name: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Product Variants
  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getProductVariantsByDocument(documentId: string): Promise<ProductVariant[]>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  deleteProductVariant(id: string): Promise<void>;
  
  // Product Projection (extract products from document structuredData)
  projectProductsFromDocument(documentId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocumentsByFolder(folderId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.folderId, folderId)).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values([document]).returning();
    return result[0];
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    const result = await db
      .update(documents)
      .set({ ...filteredUpdates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Folders
  async getFolder(id: string): Promise<Folder | undefined> {
    const result = await db.select().from(folders).where(eq(folders.id, id)).limit(1);
    return result[0];
  }

  async getAllFolders(): Promise<Folder[]> {
    return await db.select().from(folders).orderBy(desc(folders.createdAt));
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const result = await db.insert(folders).values([folder]).returning();
    return result[0];
  }

  async updateFolder(id: string, updates: Partial<InsertFolder>): Promise<Folder | undefined> {
    const result = await db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, id))
      .returning();
    return result[0];
  }

  async deleteFolder(id: string): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  // Document Versions
  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion> {
    const result = await db.insert(documentVersions).values([version]).returning();
    return result[0];
  }

  async getLatestVersionNumber(documentId: string): Promise<number> {
    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);
    
    return versions.length > 0 ? versions[0].versionNumber : 0;
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.updatedAt));
  }

  async getProductByName(name: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.name, name)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values([product]).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Product Variants
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(desc(productVariants.createdAt));
  }

  async getProductVariantsByDocument(documentId: string): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.documentId, documentId));
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const result = await db.insert(productVariants).values([variant]).returning();
    return result[0];
  }

  async deleteProductVariant(id: string): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  // Product Projection - Extract products from document structuredData
  async projectProductsFromDocument(documentId: string): Promise<void> {
    const document = await this.getDocument(documentId);
    if (!document || !document.structuredData) {
      return;
    }

    // Get the latest version number for this document
    const latestVersionNumber = await this.getLatestVersionNumber(documentId);

    // Delete existing variants for this document
    const existingVariants = await this.getProductVariantsByDocument(documentId);
    for (const variant of existingVariants) {
      await this.deleteProductVariant(variant.id);
    }

    const structuredData = document.structuredData as any;
    const copyTypes = ['ProductCopy', 'BusinessCopy', 'UpgraderCopy'];

    for (const copyType of copyTypes) {
      const copyArray = structuredData[copyType];
      if (!Array.isArray(copyArray)) continue;

      for (const item of copyArray) {
        const productName = item.ProductName;
        if (!productName) continue;

        // Find or create product
        let product = await this.getProductByName(productName);
        if (!product) {
          product = await this.createProduct({ name: productName });
        }

        // Create product variant with version tracking
        await this.createProductVariant({
          productId: product.id,
          documentId: documentId,
          versionNumber: latestVersionNumber,
          locale: document.language || null,
          copyType: copyType,
          headlines: item.Headlines || [],
          advertisingCopy: item.AdvertisingCopy || null,
          keyFeatureBullets: item.KeyFeatureBullets || [],
          legalReferences: item.LegalReferences || [],
        });
      }
    }
  }
}

export const storage = new DbStorage();
