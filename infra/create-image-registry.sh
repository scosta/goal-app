export REGION=us-west1
export REPO_NAME=goal-app-repo

gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker --location=$REGION \
    --description="Repository for goal tracking app"