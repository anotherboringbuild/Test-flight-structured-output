import { Storage, File } from "@google-cloud/storage";
import { Readable } from "stream";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document file not found in storage");
    this.name = "DocumentNotFoundError";
    Object.setPrototypeOf(this, DocumentNotFoundError.prototype);
  }
}

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
}

export class DocumentStorageService {
  private privateDir: string;

  constructor() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool."
      );
    }
    this.privateDir = dir;
  }

  async uploadDocument(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<string> {
    const fileId = randomUUID();
    const extension = originalName.split(".").pop() || "";
    const objectName = `documents/${fileId}${extension ? `.${extension}` : ""}`;
    const fullPath = `${this.privateDir}/${objectName}`;

    const { bucketName, objectName: storagePath } = parseObjectPath(fullPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      contentType: mimeType,
      metadata: {
        originalName,
        uploadedAt: new Date().toISOString(),
      },
    });

    return fullPath;
  }

  async getDocumentFile(storagePath: string): Promise<File> {
    const { bucketName, objectName } = parseObjectPath(storagePath);
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    
    const [exists] = await file.exists();
    if (!exists) {
      throw new DocumentNotFoundError();
    }
    
    return file;
  }

  async downloadDocument(storagePath: string): Promise<Buffer> {
    const file = await this.getDocumentFile(storagePath);
    const [buffer] = await file.download();
    return buffer;
  }

  async streamDocument(
    storagePath: string,
    res: import("express").Response,
    filename: string,
    mimeType: string
  ): Promise<void> {
    const file = await this.getDocumentFile(storagePath);
    const [metadata] = await file.getMetadata();

    res.set({
      "Content-Type": mimeType || metadata.contentType || "application/octet-stream",
      "Content-Length": metadata.size?.toString(),
      "Content-Disposition": `inline; filename="${filename}"`,
    });

    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    });
    stream.pipe(res);
  }

  async deleteDocument(storagePath: string): Promise<void> {
    try {
      const file = await this.getDocumentFile(storagePath);
      await file.delete();
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return;
      }
      throw error;
    }
  }
}
