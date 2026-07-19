CREATE TYPE "public"."affiliate_level" AS ENUM('iniciante', 'intermediario', 'avancado', 'master');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'withdrawal', 'spin_win', 'spin_loss', 'bonus', 'affiliate_commission');--> statement-breakpoint
CREATE TABLE "affiliate_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_id" text NOT NULL,
	"commission" real DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bet_amount" real NOT NULL,
	"main_result" real NOT NULL,
	"bonus_result" real NOT NULL,
	"total_multiplier" real NOT NULL,
	"win_amount" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"amount" real NOT NULL,
	"pix_key" text,
	"pix_name" text,
	"pix_cpf" text,
	"asaas_payment_id" text,
	"asaas_pix_code" text,
	"asaas_pix_qr_code" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"cpf" text NOT NULL,
	"password_hash" text NOT NULL,
	"balance" real DEFAULT 1000 NOT NULL,
	"bonus_balance" real DEFAULT 1000 NOT NULL,
	"total_deposited" real DEFAULT 0 NOT NULL,
	"total_withdrawn" real DEFAULT 0 NOT NULL,
	"referred_by" text,
	"affiliate_code" text NOT NULL,
	"affiliate_level" "affiliate_level" DEFAULT 'iniciante' NOT NULL,
	"affiliate_earnings" real DEFAULT 0 NOT NULL,
	"asaas_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "users_affiliate_code_unique" UNIQUE("affiliate_code")
);
--> statement-breakpoint
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spins" ADD CONSTRAINT "spins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;