CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" varchar NOT NULL,
	"description" varchar NOT NULL,
	"cover_image_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"city" varchar NOT NULL,
	"min_price_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" text NOT NULL,
	"handle" text NOT NULL,
	"role" text DEFAULT 'attendee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"address" varchar NOT NULL,
	"city" varchar NOT NULL,
	"country" varchar NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;