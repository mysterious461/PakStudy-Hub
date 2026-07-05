import {
  type AcademicResource,
  type AcademicResourceMetadata,
  type Answer,
  type ContributorResourceMetadata,
  type CreateAnswer,
  type CreateQuestion,
  type DirectConversation,
  type DirectMessage,
  type DirectMessageInput,
  type Flashcard,
  type FlashcardInput,
  type NoteListing,
  type PendingCourse,
  type PendingCourseInput,
  type PurchaseInput,
  type Question,
  type Report,
  type ReportInput,
  type StudyRoom,
  type StudyRoomInput,
  type StoredFile,
  type SupportTicket,
  type UpdateProfile,
  type UpsertUser,
  type User,
  type WalletTransaction,
} from "@shared/schema";
import { calculateSellerPayout, canMarkAnswerCorrect, canReadConversation } from "./businessRules";
import { FieldValue, db, toDate } from "./firebaseAdmin";

type AdminAction = "deleted" | "dismissed" | "banned";

export interface IStorage {
  upsertUser(user: UpsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  updateProfile(id: string, profile: UpdateProfile): Promise<User>;
  topUpWallet(userId: string, amount: number, paymentIntentId?: string): Promise<WalletTransaction>;
  listWalletTransactions(userId: string): Promise<WalletTransaction[]>;

  listQuestions(filters?: { subject?: string; search?: string; unanswered?: boolean }): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(input: CreateQuestion & { userId: string; userName: string }): Promise<Question>;
  upvoteQuestion(questionId: string, userId: string): Promise<Question>;
  saveQuestion(questionId: string, userId: string): Promise<{ saved: boolean }>;
  listSavedQuestions(userId: string): Promise<Question[]>;

  listAnswers(questionId: string): Promise<Answer[]>;
  createAnswer(questionId: string, input: CreateAnswer & { userId: string; userName: string }): Promise<Answer>;
  markAnswerCorrect(questionId: string, answerId: string, userId: string): Promise<Answer>;

  createPendingCourse(input: PendingCourseInput & { userId: string }): Promise<PendingCourse>;
  listPendingCourses(): Promise<PendingCourse[]>;
  reviewPendingCourse(id: string, status: "approved" | "rejected"): Promise<PendingCourse>;

  listNotes(filters?: { search?: string; course?: string }): Promise<NoteListing[]>;
  purchaseNote(input: PurchaseInput & { buyerId: string; paymentIntentId?: string }): Promise<{ purchaseId: string; buyerTransaction: WalletTransaction; sellerTransaction: WalletTransaction }>;

  createReport(input: ReportInput & { reporterId: string }): Promise<Report>;
  listReports(): Promise<Report[]>;
  resolveReport(id: string, action: AdminAction): Promise<Report>;
  getAdminStats(): Promise<{ users: number; questions: number; pendingReports: number; pendingCourses: number; notesForSale: number }>;
  getLeaderboard(): Promise<User[]>;
  createResource(input: AcademicResourceMetadata & { file: StoredFile; uploadedBy: string; uploadedByName: string }): Promise<AcademicResource>;
  listResources(filters?: { visibility?: string }): Promise<AcademicResource[]>;
  createContributorResource(input: ContributorResourceMetadata & { file: StoredFile; uploaderId: string; uploaderEmail?: string; uploaderName: string }): Promise<AcademicResource>;
  listResourcesByUploader(uploaderId: string): Promise<AcademicResource[]>;
  getContributorStats(uploaderId: string): Promise<{ totalUploads: number; approvedUploads: number; pendingUploads: number; rejectedUploads: number; reputationPoints: number; badgeStatus: string }>;
  listPendingResources(): Promise<AcademicResource[]>;
  reviewResource(id: string, input: { action: "approved" | "rejected" | "changes_requested"; rejectionReason?: string; reviewedBy: string }): Promise<AcademicResource>;

  listStudyRooms(filters?: { university?: string; search?: string }): Promise<StudyRoom[]>;
  createStudyRoom(input: StudyRoomInput & { hostId: string; hostName: string }): Promise<StudyRoom>;
  joinStudyRoom(roomId: string, userId: string): Promise<StudyRoom>;

  listFlashcards(userId: string): Promise<Flashcard[]>;
  createFlashcard(userId: string, input: FlashcardInput): Promise<Flashcard>;

  createSupportMessage(userId: string, message: string): Promise<SupportTicket>;
  replySupportTicket(ticketId: string, text: string): Promise<SupportTicket>;

  listConversations(userId: string): Promise<DirectConversation[]>;
  listMessages(conversationId: string, userId: string): Promise<DirectMessage[]>;
  sendDirectMessage(senderId: string, senderName: string, input: DirectMessageInput): Promise<DirectMessage>;
}

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function normalizeUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return {
    id,
    email: data.email,
    name: data.name,
    role: data.role ?? "Student",
    university: data.university ?? null,
    grade: data.grade ?? null,
    track: data.track ?? null,
    bio: data.bio ?? null,
    subjects: data.subjects ?? [],
    reputation: data.reputation ?? 0,
    walletBalance: data.walletBalance ?? 0,
    isBanned: data.isBanned ?? false,
    createdAt: toDate(data.createdAt),
  };
}

function normalizeQuestion(id: string, data: FirebaseFirestore.DocumentData): Question {
  return {
    id,
    title: data.title,
    content: data.content,
    level: data.level ?? "",
    degree: data.degree ?? "",
    course: data.course,
    subject: data.subject ?? data.course,
    university: data.university ?? null,
    userId: data.userId,
    userName: data.userName,
    isAnonymous: data.isAnonymous ?? false,
    sellNotes: data.sellNotes ?? false,
    notesPrice: data.notesPrice ?? null,
    notesFileUrl: data.notesFileUrl ?? null,
    attachmentUrls: data.attachmentUrls ?? [],
    upvotes: data.upvotes ?? 0,
    commentsCount: data.commentsCount ?? 0,
    status: data.status ?? "published",
    createdAt: toDate(data.createdAt),
  };
}

function normalizeAnswer(id: string, questionId: string, data: FirebaseFirestore.DocumentData): Answer {
  return {
    id,
    questionId,
    content: data.content,
    userId: data.userId,
    userName: data.userName,
    isCorrect: data.isCorrect ?? false,
    upvotes: data.upvotes ?? 0,
    createdAt: toDate(data.createdAt),
  };
}

function normalizeTransaction(id: string, data: FirebaseFirestore.DocumentData): WalletTransaction {
  return {
    id,
    userId: data.userId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    createdAt: toDate(data.createdAt),
  };
}

function normalizeSupportTicket(id: string, data: FirebaseFirestore.DocumentData): SupportTicket {
  return {
    id,
    userId: data.userId,
    messages: (data.messages ?? []).map((message: any) => ({
      sender: message.sender,
      text: message.text,
      createdAt: toDate(message.createdAt),
    })),
    status: data.status ?? "open",
    createdAt: toDate(data.createdAt),
  };
}

function normalizeResource(id: string, data: FirebaseFirestore.DocumentData): AcademicResource {
  const file = data.file ?? {
    path: data.filePath ?? "",
    url: data.fileUrl ?? "",
    contentType: data.fileType ?? "",
    size: data.fileSize ?? 0,
    originalName: data.fileName ?? "",
  };

  return {
    id,
    university: data.university,
    department: data.department,
    degree: data.degree,
    semester: data.semester,
    course: data.course,
    resourceType: data.resourceType,
    title: data.title,
    year: data.year ?? new Date().getFullYear(),
    description: data.description ?? "",
    tags: data.tags ?? [],
    visibility: data.visibility ?? "draft",
    uploaderNameSource: data.uploaderNameSource ?? data.uploaderName ?? "Contributor",
    permissionStatus: data.permissionStatus ?? "pending",
    file,
    status: data.status ?? data.reviewStatus ?? "pending",
    reviewStatus: data.reviewStatus ?? data.status ?? "pending",
    rejectionReason: data.rejectionReason ?? "",
    reviewedAt: data.reviewedAt ? toDate(data.reviewedAt) : undefined,
    reviewedBy: data.reviewedBy ?? undefined,
    uploadedBy: data.uploadedBy ?? data.uploaderId,
    uploadedByName: data.uploadedByName ?? data.uploaderName ?? "Contributor",
    uploaderId: data.uploaderId ?? data.uploadedBy,
    uploaderEmail: data.uploaderEmail ?? undefined,
    fileUrl: data.fileUrl ?? file.url,
    fileName: data.fileName ?? file.originalName,
    fileType: data.fileType ?? file.contentType,
    fileSize: data.fileSize ?? file.size,
    hasPermission: data.hasPermission ?? data.permissionStatus === "permission_granted",
    createdAt: toDate(data.createdAt),
    updatedAt: data.updatedAt ? toDate(data.updatedAt) : undefined,
  };
}

function conversationIdFor(a: string, b: string) {
  return [a, b].sort().join("__");
}

function sortByCreatedAtDesc<T extends { createdAt: Date }>(items: T[]) {
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export class FirestoreStorage implements IStorage {
  async upsertUser(input: UpsertUser): Promise<User> {
    const ref = db.collection("users").doc(input.id);
    const snap = await ref.get();
    const existing = snap.exists ? normalizeUser(snap.id, snap.data()!) : undefined;
    const data = clean({
      uid: input.id,
      email: input.email,
      name: input.name,
      role: input.role ?? existing?.role ?? "Student",
      university: input.university ?? existing?.university ?? null,
      grade: input.grade ?? existing?.grade ?? null,
      track: input.track ?? existing?.track ?? null,
      bio: input.bio ?? existing?.bio ?? null,
      subjects: input.subjects ?? existing?.subjects ?? [],
      reputation: input.reputation ?? existing?.reputation ?? 0,
      walletBalance: input.walletBalance ?? existing?.walletBalance ?? 0,
      isBanned: input.isBanned ?? existing?.isBanned ?? false,
      createdAt: existing?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await ref.set(data, { merge: true });
    return this.requireUser(input.id);
  }

  async getUser(id: string): Promise<User | undefined> {
    const snap = await db.collection("users").doc(id).get();
    return snap.exists ? normalizeUser(snap.id, snap.data()!) : undefined;
  }

  async listUsers(): Promise<User[]> {
    const snap = await db.collection("users").orderBy("reputation", "desc").limit(100).get();
    return snap.docs.map((doc) => normalizeUser(doc.id, doc.data()));
  }

  async updateProfile(id: string, profile: UpdateProfile): Promise<User> {
    await db.collection("users").doc(id).set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return this.requireUser(id);
  }

  async topUpWallet(userId: string, amount: number, paymentIntentId?: string): Promise<WalletTransaction> {
    const transactionRef = paymentIntentId
      ? db.collection("walletTransactions").doc(paymentIntentId)
      : db.collection("walletTransactions").doc();
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const existing = paymentIntentId ? await transaction.get(transactionRef) : undefined;
      if (existing?.exists) return;
      transaction.update(userRef, { walletBalance: FieldValue.increment(amount) });
      transaction.set(transactionRef, {
        userId,
        type: "top_up",
        amount,
        description: "Wallet top up",
        paymentIntentId: paymentIntentId ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    const snap = await transactionRef.get();
    return normalizeTransaction(transactionRef.id, snap.data()!);
  }

  async listWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    const snap = await db.collection("walletTransactions").where("userId", "==", userId).orderBy("createdAt", "desc").limit(100).get();
    return snap.docs.map((doc) => normalizeTransaction(doc.id, doc.data()));
  }

  async listQuestions(filters: { subject?: string; search?: string; unanswered?: boolean } = {}): Promise<Question[]> {
    let query: FirebaseFirestore.Query = db.collection("questions").where("status", "==", "published");
    if (filters.subject) query = query.where("subject", "==", filters.subject);
    if (filters.unanswered) query = query.where("commentsCount", "==", 0);

    const snap = await query.limit(100).get();
    const questions = snap.docs
      .map((doc) => normalizeQuestion(doc.id, doc.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (!filters.search) return questions;
    const search = filters.search.toLowerCase();
    return questions.filter((question) => `${question.title} ${question.content} ${question.subject}`.toLowerCase().includes(search));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const snap = await db.collection("questions").doc(id).get();
    if (!snap.exists) return undefined;
    const question = normalizeQuestion(snap.id, snap.data()!);
    return question.status === "removed" ? undefined : question;
  }

  async createQuestion(input: CreateQuestion & { userId: string; userName: string }): Promise<Question> {
    const ref = db.collection("questions").doc();
    const question = clean({
      title: input.title,
      content: input.content,
      level: input.level ?? "",
      degree: input.degree ?? "",
      course: input.course,
      subject: input.subject ?? input.course,
      university: input.university ?? null,
      userId: input.isAnonymous ? "anonymous" : input.userId,
      userName: input.isAnonymous ? "Anonymous Student" : input.userName,
      isAnonymous: input.isAnonymous ?? false,
      sellNotes: input.sellNotes ?? false,
      notesPrice: input.sellNotes ? input.notesPrice ?? null : null,
      notesFileUrl: input.notesFileUrl ?? null,
      attachmentUrls: input.attachmentUrls ?? [],
      upvotes: 0,
      commentsCount: 0,
      status: "published",
      createdAt: FieldValue.serverTimestamp(),
    });
    await ref.set(question);
    return (await this.getQuestion(ref.id))!;
  }

  async upvoteQuestion(questionId: string, userId: string): Promise<Question> {
    const questionRef = db.collection("questions").doc(questionId);
    const voteRef = questionRef.collection("upvotes").doc(userId);
    await db.runTransaction(async (transaction) => {
      const vote = await transaction.get(voteRef);
      if (vote.exists) return;
      transaction.set(voteRef, { userId, createdAt: FieldValue.serverTimestamp() });
      transaction.update(questionRef, { upvotes: FieldValue.increment(1) });
    });
    return this.requireQuestion(questionId);
  }

  async saveQuestion(questionId: string, userId: string): Promise<{ saved: boolean }> {
    await this.requireQuestion(questionId);
    const ref = db.collection("users").doc(userId).collection("savedQuestions").doc(questionId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      return { saved: false };
    }
    await ref.set({ questionId, createdAt: FieldValue.serverTimestamp() });
    return { saved: true };
  }

  async listSavedQuestions(userId: string): Promise<Question[]> {
    const snap = await db.collection("users").doc(userId).collection("savedQuestions").orderBy("createdAt", "desc").limit(100).get();
    const questions = await Promise.all(snap.docs.map((doc) => this.getQuestion(doc.id)));
    return questions.filter((question): question is Question => Boolean(question));
  }

  async listAnswers(questionId: string): Promise<Answer[]> {
    const snap = await db.collection("questions").doc(questionId).collection("answers").orderBy("createdAt", "asc").get();
    return snap.docs.map((doc) => normalizeAnswer(doc.id, questionId, doc.data()));
  }

  async createAnswer(questionId: string, input: CreateAnswer & { userId: string; userName: string }): Promise<Answer> {
    const questionRef = db.collection("questions").doc(questionId);
    const answerRef = questionRef.collection("answers").doc();
    await db.runTransaction(async (transaction) => {
      transaction.set(answerRef, {
        content: input.content,
        userId: input.userId,
        userName: input.userName,
        isCorrect: false,
        upvotes: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(questionRef, { commentsCount: FieldValue.increment(1) });
    });
    const snap = await answerRef.get();
    return normalizeAnswer(snap.id, questionId, snap.data()!);
  }

  async markAnswerCorrect(questionId: string, answerId: string, userId: string): Promise<Answer> {
    const question = await this.requireQuestion(questionId);
    if (!canMarkAnswerCorrect(question.userId, userId)) {
      throw Object.assign(new Error("Only the question author can mark an answer correct"), { status: 403 });
    }

    const questionRef = db.collection("questions").doc(questionId);
    const answerRef = questionRef.collection("answers").doc(answerId);
    await db.runTransaction(async (transaction) => {
      const answerSnap = await transaction.get(answerRef);
      if (!answerSnap.exists) throw Object.assign(new Error("Answer not found"), { status: 404 });
      const previous = await questionRef.collection("answers").where("isCorrect", "==", true).limit(5).get();
      previous.docs.forEach((doc) => transaction.update(doc.ref, { isCorrect: false }));
      transaction.update(answerRef, { isCorrect: true });
      const answer = normalizeAnswer(answerSnap.id, questionId, answerSnap.data()!);
      transaction.update(db.collection("users").doc(answer.userId), { reputation: FieldValue.increment(15) });
    });
    const snap = await answerRef.get();
    return normalizeAnswer(snap.id, questionId, snap.data()!);
  }

  async createPendingCourse(input: PendingCourseInput & { userId: string }): Promise<PendingCourse> {
    const ref = db.collection("pendingCourses").doc();
    await ref.set({ ...input, status: "pending", createdAt: FieldValue.serverTimestamp() });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as PendingCourse;
  }

  async listPendingCourses(): Promise<PendingCourse[]> {
    const snap = await db.collection("pendingCourses").orderBy("createdAt", "desc").limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toDate(doc.data().createdAt) } as PendingCourse));
  }

  async reviewPendingCourse(id: string, status: "approved" | "rejected"): Promise<PendingCourse> {
    const ref = db.collection("pendingCourses").doc(id);
    await ref.update({ status, reviewedAt: FieldValue.serverTimestamp() });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as PendingCourse;
  }

  async listNotes(filters: { search?: string; course?: string } = {}): Promise<NoteListing[]> {
    const questions = await this.listQuestions(filters);
    const notes = questions.filter((question) => question.sellNotes);
    const results = await Promise.all(notes.map(async (note) => {
      const purchases = await db.collection("purchases").where("noteId", "==", note.id).count().get();
      return {
        ...note,
        rating: 4.6,
        purchases: purchases.data().count,
        sellerName: note.userName,
      };
    }));
    return results;
  }

  async purchaseNote(input: PurchaseInput & { buyerId: string; paymentIntentId?: string }): Promise<{ purchaseId: string; buyerTransaction: WalletTransaction; sellerTransaction: WalletTransaction }> {
    const note = await this.requireQuestion(input.noteId);
    if (!note.sellNotes || !note.notesPrice) throw Object.assign(new Error("This question does not have paid notes"), { status: 400 });
    if (note.userId === input.buyerId) throw Object.assign(new Error("You cannot buy your own notes"), { status: 400 });

    const purchaseId = input.paymentIntentId ?? `${input.buyerId}_${input.noteId}`;
    const purchaseRef = db.collection("purchases").doc(purchaseId);
    const buyerTxRef = db.collection("walletTransactions").doc(`${purchaseId}_buyer`);
    const sellerTxRef = db.collection("walletTransactions").doc(`${purchaseId}_seller`);
    const sellerPayout = calculateSellerPayout(note.notesPrice);

    await db.runTransaction(async (transaction) => {
      const purchase = await transaction.get(purchaseRef);
      if (purchase.exists) return;
      transaction.set(purchaseRef, {
        buyerId: input.buyerId,
        sellerId: note.userId,
        noteId: input.noteId,
        amount: note.notesPrice,
        sellerPayout,
        paymentIntentId: input.paymentIntentId ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(db.collection("users").doc(note.userId), { walletBalance: FieldValue.increment(sellerPayout) });
      transaction.set(buyerTxRef, {
        userId: input.buyerId,
        type: "purchase",
        amount: -note.notesPrice!,
        description: `Bought: ${note.title}`,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(sellerTxRef, {
        userId: note.userId,
        type: "sale",
        amount: sellerPayout,
        description: `Sold: ${note.title}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    const [buyerTransaction, sellerTransaction] = await Promise.all([buyerTxRef.get(), sellerTxRef.get()]);
    return {
      purchaseId,
      buyerTransaction: normalizeTransaction(buyerTransaction.id, buyerTransaction.data()!),
      sellerTransaction: normalizeTransaction(sellerTransaction.id, sellerTransaction.data()!),
    };
  }

  async createReport(input: ReportInput & { reporterId: string }): Promise<Report> {
    const ref = db.collection("reports").doc();
    await ref.set({ ...input, status: "pending", createdAt: FieldValue.serverTimestamp() });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as Report;
  }

  async listReports(): Promise<Report[]> {
    const snap = await db.collection("reports").orderBy("createdAt", "desc").limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toDate(doc.data().createdAt) } as Report));
  }

  async resolveReport(id: string, action: AdminAction): Promise<Report> {
    const ref = db.collection("reports").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw Object.assign(new Error("Report not found"), { status: 404 });
    const report = { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as Report;

    await db.runTransaction(async (transaction) => {
      transaction.update(ref, { action, status: action === "dismissed" ? "dismissed" : "resolved", resolvedAt: FieldValue.serverTimestamp() });
      if (action === "deleted" && report.contentType === "question") {
        transaction.update(db.collection("questions").doc(report.contentId), { status: "removed" });
      }
      if (action === "banned" && report.reportedUserId) {
        transaction.update(db.collection("users").doc(report.reportedUserId), { isBanned: true });
      }
    });

    const updated = await ref.get();
    return { id: updated.id, ...updated.data(), createdAt: toDate(updated.data()?.createdAt) } as Report;
  }

  async getAdminStats(): Promise<{ users: number; questions: number; pendingReports: number; pendingCourses: number; notesForSale: number }> {
    const [users, questions, reports, courses, notes] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("questions").where("status", "==", "published").count().get(),
      db.collection("reports").where("status", "==", "pending").count().get(),
      db.collection("pendingCourses").where("status", "==", "pending").count().get(),
      db.collection("questions").where("sellNotes", "==", true).where("status", "==", "published").count().get(),
    ]);
    return {
      users: users.data().count,
      questions: questions.data().count,
      pendingReports: reports.data().count,
      pendingCourses: courses.data().count,
      notesForSale: notes.data().count,
    };
  }

  async getLeaderboard(): Promise<User[]> {
    return this.listUsers();
  }

  async createResource(input: AcademicResourceMetadata & { file: StoredFile; uploadedBy: string; uploadedByName: string }): Promise<AcademicResource> {
    const ref = db.collection("resources").doc();
    await ref.set({
      university: input.university,
      department: input.department,
      degree: input.degree,
      semester: input.semester,
      course: input.course,
      resourceType: input.resourceType,
      title: input.title,
      year: input.year,
      tags: input.tags ?? [],
      visibility: input.visibility ?? "draft",
      uploaderNameSource: input.uploaderNameSource,
      permissionStatus: input.permissionStatus ?? "pending",
      file: input.file,
      fileUrl: input.file.url,
      fileName: input.file.originalName,
      fileType: input.file.contentType,
      fileSize: input.file.size,
      status: input.visibility === "public" ? "approved" : "pending",
      reviewStatus: input.visibility === "public" ? "approved" : "pending",
      uploadedBy: input.uploadedBy,
      uploadedByName: input.uploadedByName,
      uploaderId: input.uploadedBy,
      uploaderEmail: null,
      hasPermission: input.permissionStatus === "owned" || input.permissionStatus === "permission_granted",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    return normalizeResource(snap.id, snap.data()!);
  }

  async listResources(filters: { visibility?: string } = {}): Promise<AcademicResource[]> {
    let query: FirebaseFirestore.Query = db.collection("resources");
    if (filters.visibility) query = query.where("visibility", "==", filters.visibility);
    const snap = await query.limit(100).get();
    return sortByCreatedAtDesc(snap.docs.map((doc) => normalizeResource(doc.id, doc.data())));
  }

  async createContributorResource(input: ContributorResourceMetadata & { file: StoredFile; uploaderId: string; uploaderEmail?: string; uploaderName: string }): Promise<AcademicResource> {
    const ref = db.collection("resources").doc();
    await ref.set({
      university: input.university,
      department: input.department,
      degree: input.degree,
      semester: input.semester,
      course: input.course,
      resourceType: input.resourceType,
      title: input.title,
      year: new Date().getFullYear(),
      description: input.description,
      tags: input.tags ?? [],
      visibility: "private",
      uploaderNameSource: input.uploaderName,
      permissionStatus: "permission_granted",
      hasPermission: input.hasPermission,
      status: "pending",
      reviewStatus: "pending",
      rejectionReason: "",
      file: input.file,
      fileUrl: input.file.url,
      fileName: input.file.originalName,
      fileType: input.file.contentType,
      fileSize: input.file.size,
      uploadedBy: input.uploaderId,
      uploadedByName: input.uploaderName,
      uploaderId: input.uploaderId,
      uploaderEmail: input.uploaderEmail ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    return normalizeResource(snap.id, snap.data()!);
  }

  async listResourcesByUploader(uploaderId: string): Promise<AcademicResource[]> {
    const snap = await db.collection("resources").where("uploaderId", "==", uploaderId).limit(100).get();
    return sortByCreatedAtDesc(snap.docs.map((doc) => normalizeResource(doc.id, doc.data())));
  }

  async getContributorStats(uploaderId: string): Promise<{ totalUploads: number; approvedUploads: number; pendingUploads: number; rejectedUploads: number; reputationPoints: number; badgeStatus: string }> {
    const resources = await this.listResourcesByUploader(uploaderId);
    const approvedUploads = resources.filter((resource) => resource.status === "approved").length;
    const pendingUploads = resources.filter((resource) => resource.status === "pending" || resource.status === "changes_requested").length;
    const rejectedUploads = resources.filter((resource) => resource.status === "rejected").length;
    const reputationPoints = approvedUploads * 25 + pendingUploads * 5;
    const badgeStatus = approvedUploads >= 10 ? "Founding Scholar" : resources.length > 0 ? "Founding Contributor" : "Not started";
    return {
      totalUploads: resources.length,
      approvedUploads,
      pendingUploads,
      rejectedUploads,
      reputationPoints,
      badgeStatus,
    };
  }

  async listPendingResources(): Promise<AcademicResource[]> {
    const snap = await db.collection("resources").where("status", "==", "pending").limit(100).get();
    return sortByCreatedAtDesc(snap.docs.map((doc) => normalizeResource(doc.id, doc.data())));
  }

  async reviewResource(id: string, input: { action: "approved" | "rejected" | "changes_requested"; rejectionReason?: string; reviewedBy: string }): Promise<AcademicResource> {
    const ref = db.collection("resources").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw Object.assign(new Error("Resource not found"), { status: 404 });
    const resource = normalizeResource(snap.id, snap.data()!);
    if (resource.uploaderId === input.reviewedBy || resource.uploadedBy === input.reviewedBy) {
      throw Object.assign(new Error("Reviewers cannot approve their own resources"), { status: 403 });
    }

    await ref.update({
      status: input.action,
      reviewStatus: input.action,
      visibility: input.action === "approved" ? "public" : "private",
      rejectionReason: input.action === "approved" ? "" : input.rejectionReason ?? "",
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: input.reviewedBy,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updated = await ref.get();
    return normalizeResource(updated.id, updated.data()!);
  }

  async listStudyRooms(filters: { university?: string; search?: string } = {}): Promise<StudyRoom[]> {
    let query: FirebaseFirestore.Query = db.collection("studyRooms").where("isLive", "==", true);
    if (filters.university) query = query.where("university", "==", filters.university);
    const snap = await query.orderBy("createdAt", "desc").limit(100).get();
    const rooms = snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toDate(doc.data().createdAt) } as StudyRoom));
    if (!filters.search) return rooms;
    const search = filters.search.toLowerCase();
    return rooms.filter((room) => `${room.title} ${room.subject} ${room.tags.join(" ")}`.toLowerCase().includes(search));
  }

  async createStudyRoom(input: StudyRoomInput & { hostId: string; hostName: string }): Promise<StudyRoom> {
    const ref = db.collection("studyRooms").doc();
    await ref.set({
      ...input,
      members: 1,
      isLive: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    await ref.collection("members").doc(input.hostId).set({ userId: input.hostId, joinedAt: FieldValue.serverTimestamp() });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as StudyRoom;
  }

  async joinStudyRoom(roomId: string, userId: string): Promise<StudyRoom> {
    const ref = db.collection("studyRooms").doc(roomId);
    const memberRef = ref.collection("members").doc(userId);
    await db.runTransaction(async (transaction) => {
      const member = await transaction.get(memberRef);
      if (member.exists) return;
      transaction.set(memberRef, { userId, joinedAt: FieldValue.serverTimestamp() });
      transaction.update(ref, { members: FieldValue.increment(1) });
    });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as StudyRoom;
  }

  async listFlashcards(userId: string): Promise<Flashcard[]> {
    const snap = await db.collection("flashcards").where("ownerId", "in", [userId, "system"]).limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toDate(doc.data().createdAt) } as Flashcard));
  }

  async createFlashcard(userId: string, input: FlashcardInput): Promise<Flashcard> {
    const ref = db.collection("flashcards").doc();
    await ref.set({ ...input, ownerId: userId, createdAt: FieldValue.serverTimestamp() });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as Flashcard;
  }

  async createSupportMessage(userId: string, message: string): Promise<SupportTicket> {
    const existing = await db.collection("supportTickets").where("userId", "==", userId).where("status", "==", "open").limit(1).get();
    const userMessage = { sender: "user", text: message, createdAt: new Date() };
    const autoReply = { sender: "admin", text: "Thanks for reaching out. Your ticket is now in the admin queue.", createdAt: new Date() };

    const ref = existing.empty ? db.collection("supportTickets").doc() : existing.docs[0].ref;
    if (existing.empty) {
      await ref.set({ userId, messages: [userMessage, autoReply], status: "open", createdAt: FieldValue.serverTimestamp() });
    } else {
      await ref.update({ messages: FieldValue.arrayUnion(userMessage, autoReply), updatedAt: FieldValue.serverTimestamp() });
    }
    const snap = await ref.get();
    return normalizeSupportTicket(snap.id, snap.data()!);
  }

  async replySupportTicket(ticketId: string, text: string): Promise<SupportTicket> {
    const ref = db.collection("supportTickets").doc(ticketId);
    await ref.update({
      messages: FieldValue.arrayUnion({ sender: "admin", text, createdAt: new Date() }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    return normalizeSupportTicket(snap.id, snap.data()!);
  }

  async listConversations(userId: string): Promise<DirectConversation[]> {
    const snap = await db.collection("conversations").where("memberIds", "array-contains", userId).orderBy("updatedAt", "desc").limit(100).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), updatedAt: toDate(doc.data().updatedAt) } as DirectConversation));
  }

  async listMessages(conversationId: string, userId: string): Promise<DirectMessage[]> {
    const convo = await db.collection("conversations").doc(conversationId).get();
    if (!convo.exists || !canReadConversation(convo.data()?.memberIds ?? [], userId)) {
      throw Object.assign(new Error("Conversation not found"), { status: 404 });
    }
    const snap = await convo.ref.collection("messages").orderBy("createdAt", "asc").limit(200).get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: toDate(doc.data().createdAt) } as DirectMessage));
  }

  async sendDirectMessage(senderId: string, senderName: string, input: DirectMessageInput): Promise<DirectMessage> {
    const conversationId = conversationIdFor(senderId, input.recipientId);
    const convoRef = db.collection("conversations").doc(conversationId);
    const messageRef = convoRef.collection("messages").doc();
    const message = {
      conversationId,
      senderId,
      senderName,
      recipientId: input.recipientId,
      text: input.text,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    };
    await db.runTransaction(async (transaction) => {
      transaction.set(convoRef, {
        memberIds: [senderId, input.recipientId],
        lastMessage: input.text,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(messageRef, message);
    });
    const snap = await messageRef.get();
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data()?.createdAt) } as DirectMessage;
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    if (user.isBanned) throw Object.assign(new Error("User is banned"), { status: 403 });
    return user;
  }

  private async requireQuestion(id: string): Promise<Question> {
    const question = await this.getQuestion(id);
    if (!question) throw Object.assign(new Error("Question not found"), { status: 404 });
    return question;
  }
}

export const storage = new FirestoreStorage();
