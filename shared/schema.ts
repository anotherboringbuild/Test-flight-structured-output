import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  parentFolderId: varchar("parent_folder_id").references(() => folders.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  fileType: varchar("file_type", { length: 10 }).notNull(),
  filePath: text("file_path").notNull(),
  size: text("size").notNull(),
  folderId: varchar("folder_id").references(() => folders.id, { onDelete: "set null" }),
  isOriginal: boolean("is_original").notNull().default(false),
  language: varchar("language", { length: 50 }),
  month: varchar("month", { length: 20 }),
  year: varchar("year", { length: 4 }),
  isProcessed: boolean("is_processed").notNull().default(false),
  extractedText: text("extracted_text"),
  translatedText: text("translated_text"),
  structuredData: json("structured_data"),
  validationConfidence: real("validation_confidence"),
  validationIssues: json("validation_issues").$type<string[]>(),
  needsReview: boolean("needs_review").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  extractedText: text("extracted_text"),
  structuredData: json("structured_data"),
  validationConfidence: real("validation_confidence"),
  validationIssues: json("validation_issues").$type<string[]>(),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number"),
  locale: varchar("locale", { length: 50 }),
  copyType: varchar("copy_type", { length: 50 }).notNull(),
  headlines: json("headlines").$type<string[]>(),
  advertisingCopy: text("advertising_copy"),
  keyFeatureBullets: json("key_feature_bullets").$type<string[]>(),
  legalReferences: json("legal_references").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
