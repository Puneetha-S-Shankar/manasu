import {
    pgTable,
    pgEnum,
    uuid,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
    jsonb,
    index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// ENUMS — derived directly from emotions.json 3-tier hierarchy
// ---------------------------------------------------------------------------

// Tier 1: Primary emotions (inner ring of the wheel)
export const primaryEmotionEnum = pgEnum("primary_emotion", [
    "Bad",
    "Afraid",
    "Angry",
    "Disgust",
    "Sad",
    "Happy",
    "Surprise",
]);

// Tier 2: Secondary emotions (middle ring of the wheel)
export const secondaryEmotionEnum = pgEnum("secondary_emotion", [
    // Bad
    "Boredom", "Busy", "Stress", "Tired",
    // Afraid
    "Scared", "Anxious", "Insecure", "Weak", "Shaky", "Nervous",
    // Angry
    "Mistrust", "Shame", "Jealous", "Mad", "Irritation",
    "Frustration", "Distant", "Critical",
    // Disgust
    "Disapproval", "Disdain", "Sick", "Repulsion",
    // Sad
    "Hurt", "Depression", "Guilty", "Despair", "Vulnerable", "Lonely",
    // Happy
    "Hope", "Trust", "Care", "Powerful", "Acceptance", "Proud",
    "Curiosity", "Content", "Playful",
    // Surprise
    "Excitement", "Amazement", "Confusion", "Shock",
]);

// Tier 3: Tertiary emotions (outer ring of the wheel)
export const tertiaryEmotionEnum = pgEnum("tertiary_emotion", [
    // Bad > Boredom
    "Absent", "Apathy",
    // Bad > Busy
    "Buzzy", "Pressure",
    // Bad > Stress
    "Overwhelmed", "Out of control",
    // Bad > Tired
    "Sleepy", "Blurry",
    // Afraid > Scared
    "Helpless", "Fearful",
    // Afraid > Anxious
    "Overwhelm", "Worry",
    // Afraid > Insecure
    "Small", "Inferior",
    // Afraid > Weak
    "Hollow", "Empty",
    // Afraid > Shaky
    "Trembling", "Unstable",
    // Afraid > Nervous
    "Tight", "Vulnerable",
    // Angry > Mistrust
    "Exhaustion", "Resentment",
    // Angry > Shame
    "Humiliation", "Embarrassment",
    // Angry > Jealous
    "Indignant", "Bitter",
    // Angry > Mad
    "Furious", "Rage",
    // Angry > Irritation
    "Aggressive", "Hostile",
    // Angry > Frustration
    "Tense", "Annoyance",
    // Angry > Distant
    "Withdrawn", "Numb",
    // Angry > Critical
    "Skeptical", "Dismissive",
    // Disgust > Disapproval
    "Judgment", "Shock",
    // Disgust > Disdain
    "Revulsion", "Yucky",
    // Disgust > Sick
    "Nausea", "Awful",
    // Disgust > Repulsion
    "Horror", "Hesitance",
    // Sad > Hurt
    "Pain", "Disappointment",
    // Sad > Depression
    "Heavy", "Weight",
    // Sad > Guilty
    "Remorseful", "Shame",
    // Sad > Despair
    "Powerless", "Grief",
    // Sad > Vulnerable
    "Fragile", "Shaky",
    // Sad > Lonely
    "Longing", "Achy",
    // Happy > Hope
    "Inspiration", "Openness",
    // Happy > Trust
    "Safety", "Tenderness",
    // Happy > Care
    "Gratitude", "Peaceful",
    // Happy > Powerful
    "Creative", "Courageous",
    // Happy > Acceptance
    "Importance", "Respect",
    // Happy > Proud
    "Confident", "Strong",
    // Happy > Curiosity
    "Willingness", "Interest",
    // Happy > Content
    "Joy", "Free",
    // Happy > Playful
    "Mischievous", "Arousal",
    // Surprise > Excitement
    "Energetic", "Eager",
    // Surprise > Amazement
    "Awe", "Astonishment",
    // Surprise > Confusion
    "Dizzy", "Unclear",
    // Surprise > Shock
    "Dismay", "Uncomfortable",
]);

export const timeOfDayEnum = pgEnum("time_of_day", [
    "morning",   // 05:00–11:59
    "afternoon", // 12:00–16:59
    "evening",   // 17:00–20:59
    "night",     // 21:00–04:59
]);

export const quoteSourceEnum = pgEnum("quote_source", [
    "generated", // produced by LLM at request time
    "curated",   // manually added to the library
]);

export const reactionEnum = pgEnum("reaction", [
    "helped",
    "missed",
    "saved",
]);

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// SESSIONS
// Each time a user opens the app and submits emotions = one session.
// This is the atomic unit of context fed to the LLM.
// ---------------------------------------------------------------------------

export const sessions = pgTable(
    "sessions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        timeOfDay: timeOfDayEnum("time_of_day"),
        notes: text("notes"),          // optional free-text journal entry
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        userIdIdx: index("sessions_user_id_idx").on(t.userId),
        createdAtIdx: index("sessions_created_at_idx").on(t.createdAt),
    })
);

// ---------------------------------------------------------------------------
// EMOTION LOGS
// Multiple emotions can be logged per session (the wheel allows multi-select).
// All three tiers are stored so the LLM gets the full resolution picture.
// ---------------------------------------------------------------------------

export const emotionLogs = pgTable(
    "emotion_logs",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),

        // The three wheel tiers
        primaryEmotion: primaryEmotionEnum("primary_emotion").notNull(),
        secondaryEmotion: secondaryEmotionEnum("secondary_emotion").notNull(),
        tertiaryEmotion: tertiaryEmotionEnum("tertiary_emotion"), // nullable — user may stop at tier 2

        // How prominently the user identified with this emotion (1 = peripheral, 5 = dominant)
        intensity: integer("intensity").default(3),

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        sessionIdIdx: index("emotion_logs_session_id_idx").on(t.sessionId),
        primaryEmotionIdx: index("emotion_logs_primary_emotion_idx").on(t.primaryEmotion),
    })
);

// ---------------------------------------------------------------------------
// QUOTES
// Stores both curated and LLM-generated quotes.
// Generated quotes are persisted so we never regenerate the same thing twice
// and can build a feedback loop over them.
// ---------------------------------------------------------------------------

export const quotes = pgTable("quotes", {
    id: uuid("id").defaultRandom().primaryKey(),
    content: text("content").notNull(),
    author: varchar("author", { length: 200 }),
    source: quoteSourceEnum("source").default("generated").notNull(),

    // e.g. ["grounding", "validation", "reframe", "stoic", "grief"]
    // lets you filter by therapeutic intent later
    tags: jsonb("tags").$type<string[]>().default([]),

    // Which primary emotions this quote is suited for (can match multiple)
    // e.g. ["Sad", "Afraid"]
    targetPrimaryEmotions: jsonb("target_primary_emotions").$type<string[]>().default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// QUOTE DELIVERIES
// Every time a quote is shown to a user during a session, it's logged here.
// This table is your future training signal.
// reaction = null means they saw it but neither saved nor dismissed it.
// ---------------------------------------------------------------------------

export const quoteDeliveries = pgTable(
    "quote_deliveries",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
        quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),

        // The LLM prompt context snapshot used to generate/select this quote.
        // Store it now so you can audit and improve prompts later.
        promptSnapshot: text("prompt_snapshot"),

        wasSkipped: boolean("was_skipped").default(false).notNull(),
        reaction: reactionEnum("reaction"), // null = no explicit feedback

        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => ({
        sessionIdIdx: index("quote_deliveries_session_id_idx").on(t.sessionId),
        quoteIdIdx: index("quote_deliveries_quote_id_idx").on(t.quoteId),
    })
);

// ---------------------------------------------------------------------------
// RELATIONS (for Drizzle query API / joins)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
    emotionLogs: many(emotionLogs),
    quoteDeliveries: many(quoteDeliveries),
}));

export const emotionLogsRelations = relations(emotionLogs, ({ one }) => ({
    session: one(sessions, { fields: [emotionLogs.sessionId], references: [sessions.id] }),
}));

export const quotesRelations = relations(quotes, ({ many }) => ({
    deliveries: many(quoteDeliveries),
}));

export const quoteDeliveriesRelations = relations(quoteDeliveries, ({ one }) => ({
    session: one(sessions, { fields: [quoteDeliveries.sessionId], references: [sessions.id] }),
    quote: one(quotes, { fields: [quoteDeliveries.quoteId], references: [quotes.id] }),
}));

// ---------------------------------------------------------------------------
// TYPE EXPORTS
// Inferred types for use in your API / service layer
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type EmotionLog = typeof emotionLogs.$inferSelect;
export type NewEmotionLog = typeof emotionLogs.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type QuoteDelivery = typeof quoteDeliveries.$inferSelect;
export type NewQuoteDelivery = typeof quoteDeliveries.$inferInsert;