import { BigQuery } from "@google-cloud/bigquery";

const datasetId = process.env.BIGQUERY_DATASET || "pakstudy_hub";
const tableId = process.env.BIGQUERY_EVENTS_TABLE || "events";
const enabled = process.env.BIGQUERY_ENABLED === "true";

const bigQuery = enabled ? new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
}) : null;

export async function logEvent(eventName: string, userId: string | undefined, properties: Record<string, unknown> = {}) {
  if (!bigQuery) return;

  try {
    await bigQuery.dataset(datasetId).table(tableId).insert({
      eventName,
      userId: userId ?? null,
      properties: JSON.stringify(properties),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("BigQuery event log failed:", error);
  }
}
