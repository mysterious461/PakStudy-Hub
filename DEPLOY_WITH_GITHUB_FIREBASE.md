# Deploy PakStudy Hub with GitHub Actions, Firebase Hosting, and Cloud Run

This setup avoids local Windows terminal deployment. GitHub Actions builds and deploys the app.

## Current deployment mode

`firebase.json` is intentionally configured for frontend-only Firebase Hosting first:

- Publishes `dist/public`.
- Serves SPA routes such as `/contribute`, `/contributors/upload`, `/contributors/dashboard`, and `/contributors/uploads`.
- Does not rewrite `/api/**` yet, so Firebase Hosting can deploy before the Cloud Run Admin API is enabled.

After the backend is deployed to Cloud Run, add the API rewrite shown below.

## Required Google APIs

Enable these in Google Cloud project `pakstudy-hub-d418b`:

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable firebasehosting.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

If GitHub Actions reports that it cannot enable an API, enable the API manually from the Google Cloud Console using an Owner/Editor account:

```text
https://console.cloud.google.com/apis/library?project=pakstudy-hub-d418b
```

Required API names in the console:

```text
Cloud Run Admin API
Cloud Build API
Artifact Registry API
Firebase Hosting API
Secret Manager API
```

Alternatively, grant the CI service account `Service Usage Admin` (`roles/serviceusage.serviceUsageAdmin`) so it can enable services itself. Manual enablement is safer for a production project.

If you deploy Firestore or Storage rules from CI, also ensure Firebase Management APIs are enabled from the Firebase Console or Google Cloud Console.

## Required GitHub secrets

Create these in GitHub under:

```text
mysterious461/PakStudy-Hub > Settings > Secrets and variables > Actions > Repository secrets
```

Required:

```text
GCP_SERVICE_ACCOUNT_JSON
```

`GCP_SERVICE_ACCOUNT_JSON` should be a Google Cloud service account JSON with permission to:

- Deploy Firebase Hosting.
- Deploy Cloud Run.
- Use Cloud Build.
- Push/read Artifact Registry build artifacts.
- Act as the Cloud Run runtime service account if needed.

Before adding the JSON to GitHub, confirm the file contains:

```json
"project_id": "pakstudy-hub-d418b"
```

If the JSON is for another project, either create a new key from a service account in `pakstudy-hub-d418b` or grant that service account access to `pakstudy-hub-d418b`.

Recommended roles for the CI service account:

```text
Firebase Admin
Firebase Hosting Admin
Firebase Viewer
Cloud Run Admin
Cloud Build Editor
Artifact Registry Administrator
Service Account User
Service Usage Viewer
Viewer
```

If you want the workflow to enable missing Google APIs automatically, also grant:

```text
Service Usage Admin
```

The current workflow does not auto-enable APIs. It checks for required APIs and exits with a clear message if any are missing.

### Fix `iam.serviceaccounts.actAs` during Cloud Run deploy

If Cloud Run deploy fails with:

```text
Permission 'iam.serviceaccounts.actAs' denied on service account 41032167808-compute@developer.gserviceaccount.com
```

grant the CI service account permission to act as the Cloud Run runtime service account.

In Google Cloud Console:

1. Go to IAM & Admin > Service Accounts.
2. Open this service account:

```text
41032167808-compute@developer.gserviceaccount.com
```

3. Open the Permissions tab.
4. Click Grant Access.
5. Principal: the `client_email` from `GCP_SERVICE_ACCOUNT_JSON`, currently expected to be similar to:

```text
gcp-service-account-json@pakstudy-hub-d418b.iam.gserviceaccount.com
```

6. Role:

```text
Service Account User
```

The Cloud Run workflow now makes this runtime identity explicit with:

```bash
--service-account 41032167808-compute@developer.gserviceaccount.com
```

The runtime service account also needs permissions used by the backend at runtime:

```text
Firebase Admin
Cloud Datastore User
Storage Object Admin
Secret Manager Secret Accessor
```

`Secret Manager Secret Accessor` is only required if backend secrets are attached from Secret Manager.

If this secret is missing or empty, the workflows stop at the `Verify Google auth secret` step with a clear message before calling `google-github-actions/auth`.

If Firebase Hosting deploy fails with:

```text
Failed to get Firebase project pakstudy-hub-d418b
```

check these items:

1. The `GCP_SERVICE_ACCOUNT_JSON` secret is the complete JSON file content, not only the private key.
2. The JSON has `"project_id": "pakstudy-hub-d418b"`.
3. The service account email from the JSON exists in IAM for `pakstudy-hub-d418b`.
4. The service account has at least `Firebase Admin` or `Firebase Viewer` plus `Firebase Hosting Admin`.
5. Firebase Hosting is initialized/enabled for the project in Firebase Console.
6. Required APIs are enabled, especially `firebasehosting.googleapis.com` and Firebase Management APIs.

The workflows use Node 24-compatible action versions:

```text
actions/checkout@v6
actions/setup-node@v6
google-github-actions/auth@v3
google-github-actions/setup-gcloud@v3
```

Do not add Firebase Admin service account JSON to frontend files. If the backend needs explicit Firebase Admin credentials, store them in Google Secret Manager or GitHub secrets and inject them only into Cloud Run.

## Cloud Run backend environment variables

Required:

```text
NODE_ENV=production
FIREBASE_PROJECT_ID=pakstudy-hub-d418b
GOOGLE_CLOUD_PROJECT=pakstudy-hub-d418b
FIREBASE_STORAGE_BUCKET=pakstudy-hub-d418b.firebasestorage.app
```

Firebase Admin credentials:

- Preferred: use Cloud Run Application Default Credentials with IAM permissions on the runtime service account.
- Alternative: set `FIREBASE_SERVICE_ACCOUNT_JSON` as a Cloud Run secret-backed environment variable.

Optional:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
OPENAI_MODEL=gpt-4.1-mini
PAYMENTS_CURRENCY=pkr
BIGQUERY_ENABLED=false
BIGQUERY_DATASET=pakstudy_hub
BIGQUERY_EVENTS_TABLE=events
```

## Firebase project settings

In Firebase Console:

1. Open project `pakstudy-hub-d418b`.
2. Go to Authentication > Settings > Authorized domains.
3. Add:

```text
pakstudy-hub-d418b.web.app
pakstudy-hub-d418b.firebaseapp.com
```

4. Add any custom domain after it is connected.
5. Confirm Firestore and Storage are enabled.

## Deploy frontend only

Use GitHub Actions:

1. Push this repo to GitHub.
2. Add `GCP_SERVICE_ACCOUNT_JSON` as a GitHub secret.
3. Open Actions.
4. Run `Deploy Firebase Hosting` manually.

The workflow:

- Installs dependencies with `npm ci`.
- Runs `npm run check`.
- Runs `npm test`.
- Runs `npm run build`.
- Deploys `dist/public` to Firebase Hosting.

After this deploy, these routes should work publicly:

```text
https://pakstudy-hub-d418b.web.app/contribute
https://pakstudy-hub-d418b.web.app/contributors/upload
https://pakstudy-hub-d418b.web.app/contributors/dashboard
https://pakstudy-hub-d418b.web.app/contributors/uploads
```

Until the API rewrite is added, backend calls from those pages will not work on Hosting.

## Deploy backend to Cloud Run

Use GitHub Actions:

1. Ensure required Google APIs are enabled.
2. Open Actions.
3. Run `Deploy Cloud Run Backend` manually.
4. Keep defaults:

```text
service = pakstudy-hub-api
region = us-central1
```

The backend already listens on `process.env.PORT`, which Cloud Run provides.

The workflow deploys from source:

```bash
gcloud run deploy pakstudy-hub-api \
  --source . \
  --project pakstudy-hub-d418b \
  --region us-central1 \
  --allow-unauthenticated
```

## Optional: use Google Secret Manager for backend secrets

Create secrets:

```bash
gcloud secrets create stripe-secret-key --replication-policy=automatic
gcloud secrets create stripe-webhook-secret --replication-policy=automatic
gcloud secrets create openai-api-key --replication-policy=automatic
gcloud secrets create firebase-service-account-json --replication-policy=automatic
```

Add secret versions:

```bash
gcloud secrets versions add stripe-secret-key --data-file=stripe-secret.txt
gcloud secrets versions add stripe-webhook-secret --data-file=stripe-webhook-secret.txt
gcloud secrets versions add openai-api-key --data-file=openai-key.txt
gcloud secrets versions add firebase-service-account-json --data-file=service-account.json
```

Attach them to Cloud Run:

```bash
gcloud run services update pakstudy-hub-api \
  --project pakstudy-hub-d418b \
  --region us-central1 \
  --set-secrets STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,OPENAI_API_KEY=openai-api-key:latest,FIREBASE_SERVICE_ACCOUNT_JSON=firebase-service-account-json:latest
```

## Add Firebase Hosting API rewrite after Cloud Run is live

After Cloud Run is deployed and `run.googleapis.com` is enabled, update `firebase.json` rewrites to include `/api/**` before the SPA fallback:

```json
"rewrites": [
  {
    "source": "/api/**",
    "run": {
      "serviceId": "pakstudy-hub-api",
      "region": "us-central1"
    }
  },
  {
    "source": "**",
    "destination": "/index.html"
  }
]
```

Then run the `Deploy Firebase Hosting` workflow again.

## Verification checklist

After frontend-only deployment:

- `/contribute` loads directly.
- `/contributors/upload` loads and redirects anonymous users to login.
- `/contributors/dashboard` and `/contributors/uploads` are handled by SPA routing.

After backend and API rewrite deployment:

- `/api/health` returns `{"status":"ok","service":"PakStudy Hub API"}`.
- Contributor upload reaches `/api/contributor/resources`.
- Files save to Firebase Storage.
- Metadata saves to Firestore `resources`.
- Admin review APIs work for Admin/Moderator users.

## Local command equivalents

These are optional; GitHub Actions is the preferred deployment path.

```bash
npm ci
npm run check
npm test
npm run build
firebase deploy --only hosting --project pakstudy-hub-d418b
```
