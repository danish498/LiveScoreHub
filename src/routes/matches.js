import { Router } from "express";
import { desc } from "drizzle-orm";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { getMatchStatus } from "../validation/match-status.js";

export const matcherRoute = Router();

matcherRoute.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid query.", details: parsed.error.issues });
  }

  const limit = Math.min(parsed.data.limit ?? 50, 100);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (e) {
    console.error("Error fetching matches:", e);
    res.status(500).json({ error: "Failed to list matches." });
  }
});

matcherRoute.post("/", async (req, res) => {
  try {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid payload.", details: parsed.error.issues });
    }

    const {
      data: { startTime, endTime, homeScore, awayScore },
    } = parsed;

    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    if (res.app.locals.broadcastMatchCreated) {
      res.app.locals.broadcastMatchCreated(event);
    }

    res.status(201).json(event);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
