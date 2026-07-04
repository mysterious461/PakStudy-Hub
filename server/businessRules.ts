export function isAdminRole(role: string | undefined) {
  return role === "Admin" || role === "Moderator";
}

export function canMarkAnswerCorrect(questionOwnerId: string, actorId: string) {
  return questionOwnerId === actorId;
}

export function calculateSellerPayout(amount: number, platformFeeRate = 0.1) {
  return Math.round(amount * (1 - platformFeeRate));
}

export function canReadConversation(memberIds: string[], actorId: string) {
  return memberIds.includes(actorId);
}
