CREATE TYPE "public"."core_emotion" AS ENUM('Bad', 'Afraid', 'Angry', 'Disgust', 'Sad', 'Happy', 'Surprise');--> statement-breakpoint
CREATE TYPE "public"."quote_source" AS ENUM('generated', 'curated');--> statement-breakpoint
CREATE TYPE "public"."reaction" AS ENUM('helped', 'missed', 'saved');--> statement-breakpoint
CREATE TYPE "public"."secondary_emotion" AS ENUM('Boredom', 'Busy', 'Stress', 'Tired', 'Scared', 'Anxious', 'Insecure', 'Weak', 'Shaky', 'Nervous', 'Mistrust', 'Shame_Angry', 'Jealous', 'Mad', 'Irritation', 'Frustration', 'Distant', 'Critical', 'Disapproval', 'Disdain', 'Sick', 'Repulsion', 'Hurt', 'Depression', 'Guilty', 'Despair', 'Vulnerable_Sad', 'Lonely', 'Hope', 'Trust', 'Care', 'Powerful', 'Acceptance', 'Proud', 'Curiosity', 'Content', 'Playful', 'Excitement', 'Amazement', 'Confusion', 'Shock_Surprise');--> statement-breakpoint
CREATE TYPE "public"."specific_emotion" AS ENUM('Absent', 'Apathy', 'Buzzy', 'Pressure', 'Overwhelmed', 'Out_of_control', 'Sleepy', 'Blurry', 'Helpless', 'Fearful', 'Overwhelm', 'Worry', 'Small', 'Inferior', 'Hollow', 'Empty', 'Trembling', 'Unstable', 'Tight', 'Vulnerable_Nervous', 'Exhaustion', 'Resentment', 'Humiliation', 'Embarrassment', 'Indignant', 'Bitter', 'Furious', 'Rage', 'Aggressive', 'Hostile', 'Tense', 'Annoyance', 'Withdrawn', 'Numb', 'Skeptical', 'Dismissive', 'Judgment', 'Shock_Disapproval', 'Revulsion', 'Yucky', 'Nausea', 'Awful', 'Horror', 'Hesitance', 'Pain', 'Disappointment', 'Heavy', 'Weight', 'Remorseful', 'Shame_Guilty', 'Powerless', 'Grief', 'Fragile', 'Shaky_Sad', 'Longing', 'Achy', 'Inspiration', 'Openness', 'Safety', 'Tenderness', 'Gratitude', 'Peaceful', 'Creative', 'Courageous', 'Importance', 'Respect', 'Confident', 'Strong', 'Willingness', 'Interest', 'Joy', 'Free', 'Mischievous', 'Arousal', 'Energetic', 'Eager', 'Awe', 'Astonishment', 'Dizzy', 'Unclear', 'Dismay', 'Uncomfortable');--> statement-breakpoint
CREATE TYPE "public"."time_of_day" AS ENUM('morning', 'afternoon', 'evening', 'night');--> statement-breakpoint
CREATE TABLE "emotion_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"core_emotion" "core_emotion" NOT NULL,
	"secondary_emotion" "secondary_emotion" NOT NULL,
	"specific_emotion" "specific_emotion",
	"intensity" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"quote_id" uuid,
	"prompt_snapshot" text,
	"was_skipped" boolean DEFAULT false NOT NULL,
	"reaction" "reaction",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"author" varchar(200),
	"source" "quote_source" DEFAULT 'generated' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"target_core_emotions" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"time_of_day" time_of_day,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "emotion_logs" ADD CONSTRAINT "emotion_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_deliveries" ADD CONSTRAINT "quote_deliveries_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_deliveries" ADD CONSTRAINT "quote_deliveries_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emotion_logs_session_id_idx" ON "emotion_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "emotion_logs_core_emotion_idx" ON "emotion_logs" USING btree ("core_emotion");--> statement-breakpoint
CREATE INDEX "quote_deliveries_session_id_idx" ON "quote_deliveries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quote_deliveries_quote_id_idx" ON "quote_deliveries" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");