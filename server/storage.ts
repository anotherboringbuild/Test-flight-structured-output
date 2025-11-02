import { type Document, type InsertDocument, type Folder, type InsertFolder } from "@shared/schema";
import { db } from "@db";
import { documents, folders } from "@shared/schema";
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
    const result = await db.insert(documents).values(document).returning();
    return result[0];
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
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
    const result = await db.insert(folders).values(folder).returning();
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
}

export const storage = new DbStorage();
