# enable API
gcloud services enable run.googleapis.com

# create service account
export SA_NAME=goal-app-sa
gcloud iam service-accounts create $SA_NAME \
    --description="Service account for goal tracking app" \
    --display-name="Goal App SA"

# grant roles: access Firestore, Pub/Sub, secret manager
PROJECT=$(gcloud config get-value project)
gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SA_NAME@$PROJECT.iam.gserviceaccount.com" \
    --role=roles/datastore.user

gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$SA_NAME@$PROJECT.iam.gserviceaccount.com" \
    --role=roles/pubsub.publisher