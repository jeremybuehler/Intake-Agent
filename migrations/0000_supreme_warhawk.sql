CREATE TABLE "job_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_email" text,
	"customer_address" text NOT NULL,
	"service_type" text NOT NULL,
	"description" text NOT NULL,
	"ai_summary" text NOT NULL,
	"issue_type" text NOT NULL,
	"urgency" text NOT NULL,
	"potential_parts" text[],
	"preferred_time" text,
	"source" text NOT NULL,
	"submitted_at" timestamp NOT NULL,
	"status" text DEFAULT 'pending_intake' NOT NULL,
	"ai_confidence" integer DEFAULT 0,
	"processing_time_ms" integer,
	CONSTRAINT "job_records_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "twilio_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_sid" text NOT NULL,
	"auth_token" text NOT NULL,
	"phone_number" text NOT NULL,
	"webhook_url" text,
	"sms_enabled" boolean DEFAULT true NOT NULL,
	"voice_enabled" boolean DEFAULT true NOT NULL,
	"transcription_enabled" boolean DEFAULT true NOT NULL,
	"auto_response_enabled" boolean DEFAULT true NOT NULL,
	"fallback_url" text,
	"status_callback_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
