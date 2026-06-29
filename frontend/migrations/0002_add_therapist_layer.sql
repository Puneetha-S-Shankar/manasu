-- Therapist layer: therapists, client links, quote packs, pushes, mood alerts
CREATE TYPE "public"."therapist_role" AS ENUM('therapist', 'admin');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('low_mood_streak', 'high_intensity', 'no_checkin');--> statement-breakpoint
CREATE TYPE "public"."push_type" AS ENUM('quote', 'exercise');--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"license_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "therapists_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "therapist_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_therapist_client" UNIQUE("therapist_id","client_id")
);
--> statement-breakpoint
CREATE TABLE "quote_packs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_pack_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"order" integer
);
--> statement-breakpoint
CREATE TABLE "therapist_pushes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"quote_id" uuid,
	"pack_id" uuid,
	"content" text,
	"push_type" "push_type" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"seen_at" timestamp,
	"reaction" "reaction"
);
--> statement-breakpoint
CREATE TABLE "mood_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"alert_type" "alert_type" NOT NULL,
	"reason" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "therapist_clients" ADD CONSTRAINT "therapist_clients_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_clients" ADD CONSTRAINT "therapist_clients_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_packs" ADD CONSTRAINT "quote_packs_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_pack_items" ADD CONSTRAINT "quote_pack_items_pack_id_quote_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."quote_packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_pack_items" ADD CONSTRAINT "quote_pack_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_pushes" ADD CONSTRAINT "therapist_pushes_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_pushes" ADD CONSTRAINT "therapist_pushes_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_pushes" ADD CONSTRAINT "therapist_pushes_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_pushes" ADD CONSTRAINT "therapist_pushes_pack_id_quote_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."quote_packs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_alerts" ADD CONSTRAINT "mood_alerts_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mood_alerts" ADD CONSTRAINT "mood_alerts_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "therapist_clients_therapist_id_idx" ON "therapist_clients" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_clients_client_id_idx" ON "therapist_clients" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "quote_packs_therapist_id_idx" ON "quote_packs" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "quote_pack_items_pack_id_idx" ON "quote_pack_items" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "therapist_pushes_therapist_id_idx" ON "therapist_pushes" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_pushes_client_id_idx" ON "therapist_pushes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "mood_alerts_therapist_id_idx" ON "mood_alerts" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "mood_alerts_client_id_idx" ON "mood_alerts" USING btree ("client_id");
