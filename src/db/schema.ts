import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
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
      // deposit
      // withdrawal
      // spin


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
// CONFIG ASAAS
// =====================================

export const asaasConfig = pgTable(
  "asaas_config",
  {

    id: uuid("id")
      .defaultRandom()
      .primaryKey(),


    apiKey: text("api_key")
      .notNull(),


    mode: text("mode")
      .default("sandbox")
      .notNull(),


    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull()

  }
);




// =====================================
// CONFIG STRIPE
// =====================================

export const stripeConfig = pgTable(
  "stripe_config",
  {

    id: uuid("id")
      .defaultRandom()
      .primaryKey(),


    secretKey: text("secret_key")
      .notNull(),


    webhookSecret: text("webhook_secret"),


    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull()

  }
);




// =====================================
// CONFIG PAYPAL
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
// SPINS / ROLETA
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
// AFFILIATES
// =====================================

export const affiliates = pgTable(
  "affiliates",
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
