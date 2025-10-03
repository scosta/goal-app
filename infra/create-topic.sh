# create topic for goal events
export GOAL_TOPIC=goal-events

# create topic
gcloud pubsub topics create $GOAL_TOPIC

# create subscription (pull)
gcloud pubsub subscriptions create goal-events-sub --topic=$GOAL_TOPIC