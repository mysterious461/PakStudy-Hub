import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateSellerPayout,
  canMarkAnswerCorrect,
  canReadConversation,
  isAdminRole,
} from "./businessRules";

test("purchase payout keeps a 10 percent platform fee", () => {
  assert.equal(calculateSellerPayout(500), 450);
  assert.equal(calculateSellerPayout(999), 899);
});

test("only the question owner can award correct-answer reputation", () => {
  assert.equal(canMarkAnswerCorrect("question-owner", "question-owner"), true);
  assert.equal(canMarkAnswerCorrect("question-owner", "another-user"), false);
});

test("moderation endpoints are limited to admin and moderator roles", () => {
  assert.equal(isAdminRole("Admin"), true);
  assert.equal(isAdminRole("Moderator"), true);
  assert.equal(isAdminRole("Student"), false);
  assert.equal(isAdminRole(undefined), false);
});

test("conversation reads are limited to members", () => {
  assert.equal(canReadConversation(["u1", "u2"], "u1"), true);
  assert.equal(canReadConversation(["u1", "u2"], "u3"), false);
});
