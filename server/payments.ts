import Stripe from "stripe";
import type { PaymentIntentResponse } from "@shared/schema";

const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = secretKey ? new Stripe(secretKey, {
  apiVersion: "2026-06-24.dahlia",
}) : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw Object.assign(new Error("Stripe is not configured. Set STRIPE_SECRET_KEY."), { status: 503 });
  }
  return stripe;
}

export async function createWalletTopUpIntent(userId: string, amountPkr: number): Promise<PaymentIntentResponse> {
  const client = requireStripe();
  const currency = process.env.PAYMENTS_CURRENCY || "pkr";
  const session = await client.checkout.sessions.create({
    mode: "payment",
    success_url: process.env.PAYMENTS_SUCCESS_URL || "http://localhost:5000/profile?payment=success",
    cancel_url: process.env.PAYMENTS_CANCEL_URL || "http://localhost:5000/profile?payment=cancelled",
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amountPkr * 100,
        product_data: { name: `PakStudy Wallet Top-up Rs. ${amountPkr}` },
      },
    }],
    metadata: {
      type: "wallet_top_up",
      userId,
      amount: String(amountPkr),
    },
  });

  return {
    paymentIntentId: session.id,
    clientSecret: null,
    checkoutUrl: session.url,
    amount: amountPkr,
    currency,
  };
}

export async function createNotePurchaseIntent(userId: string, noteId: string, amountPkr: number): Promise<PaymentIntentResponse> {
  const client = requireStripe();
  const currency = process.env.PAYMENTS_CURRENCY || "pkr";
  const session = await client.checkout.sessions.create({
    mode: "payment",
    success_url: process.env.PAYMENTS_SUCCESS_URL || "http://localhost:5000/library?payment=success",
    cancel_url: process.env.PAYMENTS_CANCEL_URL || "http://localhost:5000/subjects?payment=cancelled",
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amountPkr * 100,
        product_data: { name: "PakStudy paid notes" },
      },
    }],
    metadata: {
      type: "note_purchase",
      buyerId: userId,
      noteId,
      amount: String(amountPkr),
    },
  });

  return {
    paymentIntentId: session.id,
    clientSecret: null,
    checkoutUrl: session.url,
    amount: amountPkr,
    currency,
  };
}
