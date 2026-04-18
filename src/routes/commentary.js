import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  listCommentaryQuerySchema,
  createCommentarySchema,
} from "../validation/commentary.js";

export const commentaryRoute = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRoute.get("/", async (req, res) => {
  try {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        error: "Invalid match ID.",
        details: paramsParsed.error.issues,
      });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return res.status(400).json({
        error: "Invalid query parameters.",
        details: queryParsed.error.issues,
      });
    }

    const matchId = paramsParsed.data.id;
    const limit = Math.min(queryParsed.data.limit ?? MAX_LIMIT, MAX_LIMIT);

    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (error) {
    console.error("Error fetching commentary:", error);
    res.status(500).json({ error: "Failed to fetch commentary." });
  }
});

commentaryRoute.post("/", async (req, res) => {
  try {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        error: "Invalid match ID.",
        details: paramsParsed.error.issues,
      });
    }

    const bodyParsed = createCommentarySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        error: "Invalid payload.",
        details: bodyParsed.error.issues,
      });
    }

    const matchId = paramsParsed.data.id;

    const [event] = await db
      .insert(commentary)
      .values({
        matchId,
        ...bodyParsed.data,
      })
      .returning();
      
    if (req.app.locals.broadcastCommentary) {
       req.app.locals.broadcastCommentary(matchId, event);
    }

    res.status(201).json(event);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating commentary:", error);
    res.status(500).json({ error: "Failed to create commentary." });
  }
});
