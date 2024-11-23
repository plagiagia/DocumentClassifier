import type { Express } from "express";
import { db } from "../db";
import { documents, users } from "@db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

function encryptData(data: Buffer, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + tag.toString('hex');
}

export function registerRoutes(app: Express) {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const user = await db.insert(users).values({
        username,
        password: hashedPassword
      }).returning();
      req.session.userId = user[0].id;
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });
    
    if (user && user.password === hashedPassword) {
      req.session.userId = user.id;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Document routes
  app.post("/api/documents", upload.single('file'), async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const encrypted = encryptData(file.buffer, encryptionKey);

    const doc = await db.insert(documents).values({
      userId: req.session.userId,
      title: req.body.title,
      content: encryptionKey,
      encrypted,
      contentType: file.mimetype,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    }).returning();

    res.json(doc[0]);
  });

  app.get("/api/documents", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const docs = await db.query.documents.findMany({
      where: eq(documents.userId, req.session.userId),
      orderBy: (documents, { desc }) => [desc(documents.createdAt)]
    });

    res.json(docs);
  });

  app.put("/api/documents/:id/tags", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { tags } = req.body;

    const doc = await db.update(documents)
      .set({ tags })
      .where(eq(documents.id, parseInt(id)))
      .returning();

    res.json(doc[0]);
  });
}
