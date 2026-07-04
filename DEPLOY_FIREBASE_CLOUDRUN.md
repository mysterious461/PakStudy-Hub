# Deploy PakStudy Hub to Firebase Hosting + Google Cloud Run

This deployment keeps the public web frontend on Firebase Hosting and runs the Node/Express API on Google Cloud Run.

## Architecture

- Firebase Hosting serves the static frontend from `dist/public`.
- Firebase Hosting rewrites `/api/**` to the Cloud Run service `pakstudy-hub-api` in `us-central1`.
- All browser routes, including `/contribute`, `/contributors/upload`, `/contributors/dashboard`, and `/contributors/uploads`, fall back to `index.html`.
- Firebase Admin SDK credentials are used only by the Cloud Run backend. They must never be placed in frontend code.

## Prerequisites

Install and authenticate the CLIs:

```bash
npm install -g firebase-tools
gcloud auth login
firebase login
gcloud config set project pakstudy-hub-d418b
firebase use pakstudy-hub-d418b
```

Enable required Google Cloud services:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firebasehosting.googleapis.com
```

## Required Cloud Run environment variables

Set these on the Cloud Run service:

```text
NODE_ENV=production
FIREBASE_PROJECT_ID=pakstudy-hub-d418b
GOOGLE_CLOUD_PROJECT=pakstudy-hub-d418b
FIREBASE_STORAGE_BUCKET=pakstudy-hub-d418b.firebasestorage.app
```

Authentication for Firebase Admin SDK:

- Preferred on Google Cloud: use Application Default Credentials through the Cloud Run runtime service account.
- Alternative: set `FIREBASE_SERVICE_ACCOUNT_JSON` as a Cloud Run secret-backed environment variable.

Optional variables:

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYMENTS_CURRENCY=pkr
PAYMENTS_SUCCESS_URL=https://pakstudy-hub-d418b.web.app/profile?payment=success
PAYMENTS_CANCEL_URL=https://pakstudy-hub-d418b.web.app/profile?payment=cancelled
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
BIGQUERY_ENABLED=false
BIGQUERY_DATASET=pakstudy_hub
BIGQUERY_EVENTS_TABLE=events
```

## Deploy the backend to Cloud Run

Build and deploy from source:

```bash
gcloud run deploy pakstudy-hub-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=pakstudy-hub-d418b,GOOGLE_CLOUD_PROJECT=pakstudy-hub-d418b,FIREBASE_STORAGE_BUCKET=pakstudy-hub-d418b.firebasestorage.app,PAYMENTS_CURRENCY=pkr,OPENAI_MODEL=gpt-4.1-mini,BIGQUERY_ENABLED=false
```

If you use `FIREBASE_SERVICE_ACCOUNT_JSON`, store it as a secret instead of passing it directly on the command line:

```bash
gcloud secrets create pakstudy-firebase-service-account --replication-policy=automatic
gcloud secrets versions add pakstudy-firebase-service-account --data-file=service-account.json

gcloud run services update pakstudy-hub-api \
  --region us-central1 \
  --set-secrets FIREBASE_SERVICE_ACCOUNT_JSON=pakstudy-firebase-service-account:latest
```

If you use Application Default Credentials, grant the Cloud Run runtime service account enough access:

```bash
PROJECT_ID=pakstudy-hub-d418b
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
RUNTIME_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/storage.objectAdmin"
```

## Build and deploy Firebase Hosting

```bash
npm ci
npm run build
firebase deploy --only hosting,firestore:rules,storage
```

The frontend build output path is `dist/public`, as configured in `vite.config.ts` and `firebase.json`.

## Verify deployment

Open these URLs after deploy:

```text
https://pakstudy-hub-d418b.web.app/contribute
https://pakstudy-hub-d418b.web.app/contributors/upload
https://pakstudy-hub-d418b.web.app/contributors/dashboard
https://pakstudy-hub-d418b.web.app/api/health
```

Expected behavior:

- `/contribute` loads directly from a shared browser link.
- `/contributors/upload` redirects anonymous users to login with `returnTo=/contributors/upload`.
- After login/signup, users return to the upload page.
- Uploads call `/api/contributor/resources`, which Firebase Hosting rewrites to Cloud Run.
- Uploaded files are stored in Firebase Storage and metadata is stored in Firestore `resources`.
- Admin review continues through `/api/admin/resources/pending` and `/api/admin/resources/:id/review`.

## Firebase Auth domain

Add every public domain to Firebase Console:

```text
Authentication > Settings > Authorized domains
```

Include:

```text
pakstudy-hub-d418b.web.app
pakstudy-hub-d418b.firebaseapp.com
```

Add any custom domain here too.

## Notes

- Do not commit service account JSON files.
- Do not add Firebase Admin credentials to `client/src`.
- The browser only uses the public Firebase web config in `client/src/lib/firebase.ts`.
- Backend APIs use Firebase Admin SDK on Cloud Run.
- If you change the Cloud Run service name or region, update the `hosting.rewrites[0].run` block in `firebase.json`.
