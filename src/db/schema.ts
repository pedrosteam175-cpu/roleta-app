import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean
} from "drizzle-orm/pg-core";


// =====================================
// USERS
// =====================================

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: text("name")
      .notNull(),

    email: text("email")
      .notNull()
      .unique(),

    password: text("password")
      .notNull(),

    cpf: text("cpf"),

    balance: numeric("balance")
      .default("0")
      .notNull(),

    totalDeposited: numeric("total_deposited")
      .default("0")
      .notNull(),

    totalWithdrawn: numeric("total_withdrawn")
      .default("0")
      .notNull(),

    referralCode: text("referral_code"),

    referredBy: text("referred_by"),

    isAdmin: boolean("is_admin")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
  }
);



// =====================================
// TRANSACTIONS
// =====================================

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull(),

    type: text("type")
      .notNull(),

    amount: numeric("amount")
      .notNull(),

    status: text("status")
      .default("pending")
      .notNull(),

    pixKey: text("pix_key"),

    pixName: text("pix_name"),

    pixCpf: text("pix_cpf"),

    paypalEmail: text("paypal_email"),

    externalId: text("external_id"),

    description: text("description"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
  }
);



// =====================================
// PAYPAL PAYOUT CONFIG
// =====================================

export const paypalSettings = pgTable(
  "paypal_settings",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    clientId: text("client_id")
      .notNull(),

    clientSecret: text("client_secret")
      .notNull(),

    mode: text("mode")
      .default("sandbox")
      .notNull(),

    senderEmail: text("sender_email"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
  }
);



// =====================================
// SPINS ROLETA
// =====================================

export const spins = pgTable(
  "spins",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull(),

    prize: text("prize")
      .notNull(),

    amount: numeric("amount")
      .default("0")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull()
  }
);



// =====================================
// AFILIADOS
// =====================================

export const affiliateReferrals = pgTable(
  "affiliate_referrals",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull(),

    referredUserId: uuid("referred_user_id")
      .notNull(),

    commission: numeric("commission")
      .default("0")
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull()
  }
);



// =====================================
// APP CONFIG (STRIPE / ASAAS)
// =====================================

export const appConfig = pgTable(
  "app_config",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    key: text("key")
      .notNull()
      .unique(),

    value: text("value"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
  }
);
