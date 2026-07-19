import { pgTable, text, real, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'withdrawal', 'spin_win', 'spin_loss', 'bonus', 'affiliate_commission']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const affiliateLevelEnum = pgEnum('affiliate_level', ['iniciante', 'intermediario', 'avancado', 'master']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  cpf: text('cpf').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  balance: real('balance').notNull().default(1000),
  bonusBalance: real('bonus_balance').notNull().default(1000),
  totalDeposited: real('total_deposited').notNull().default(0),
  totalWithdrawn: real('total_withdrawn').notNull().default(0),
  referredBy: text('referred_by'),
  affiliateCode: text('affiliate_code').notNull().unique(),
  affiliateLevel: affiliateLevelEnum('affiliate_level').notNull().default('iniciante'),
  affiliateEarnings: real('affiliate_earnings').notNull().default(0),
  asaasCustomerId: text('asaas_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  amount: real('amount').notNull(),
  pixKey: text('pix_key'),
  pixName: text('pix_name'),
  pixCpf: text('pix_cpf'),
  asaasPaymentId: text('asaas_payment_id'),
  asaasPixCode: text('asaas_pix_code'),
  asaasPixQrCode: text('asaas_pix_qr_code'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const spins = pgTable('spins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  betAmount: real('bet_amount').notNull(),
  mainResult: real('main_result').notNull(),
  bonusResult: real('bonus_result').notNull(),
  totalMultiplier: real('total_multiplier').notNull(),
  winAmount: real('win_amount').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const affiliateReferrals = pgTable('affiliate_referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id),
  referredId: text('referred_id').notNull().references(() => users.id),
  commission: real('commission').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
