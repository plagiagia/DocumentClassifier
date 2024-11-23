import type { Express, Request } from "express";
import session from "express-session";
import { db } from "../db";
import { documents, users } from "@db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import bcrypt from "bcrypt";
import { z } from "zod";

const authSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100)
});

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const upload = multer({ storage: multer.memoryStorage() });

function encryptData(data: Buffer, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + tag.toString('hex');
}

export function registerRoutes(app: Express) {
  // Configure session middleware
  app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = authSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }
      
      const { username, password } = result.data;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await db.insert(users).values({
        username,
        password: hashedPassword
      }).returning();
      
      req.session.userId = user[0].id;
      res.json({ success: true });
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = authSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error.issues });
      }

      const { username, password } = result.data;
      const user = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
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
