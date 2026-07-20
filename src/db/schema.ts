// ===============================
// PAYPAL PAYOUT CONFIGURATION
// ===============================

import {
  pgTable,
  uuid,
  text,
  timestamp
} from "drizzle-orm/pg-core";


export const paypalSettings = pgTable(
  "paypal_settings",
  {

    id: uuid("id")
      .defaultRandom()
      .primaryKey(),


    // PayPal Client ID
    clientId: text("client_id")
      .notNull(),


    // Secret criptografado
    clientSecret: text("client_secret")
      .notNull(),


    // sandbox ou live
    mode: text("mode")
      .notNull()
      .default("sandbox"),


    // conta que envia pagamentos
    senderEmail: text("sender_email"),


    createdAt: timestamp(
      "created_at"
    )
    .defaultNow()
    .notNull(),


    updatedAt: timestamp(
      "updated_at"
    )
    .defaultNow()
    .notNull()

  }
);
