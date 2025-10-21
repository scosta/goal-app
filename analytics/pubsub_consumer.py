import os
import json
import pandas as pd
from dotenv import load_dotenv
from google.cloud import pubsub_v1
from databricks import sql

# Load environment variables from .env file in project root
load_dotenv("../.env")

PROJECT_ID = os.getenv("FIRESTORE_PROJECT_ID")
GOAL_TOPIC = os.getenv("PUBSUB_TOPIC", "goal-events")
PUBSUB_EMULATOR_HOST = os.getenv("PUBSUB_EMULATOR_HOST")

# Configure PubSub client
if PUBSUB_EMULATOR_HOST:
    print(f"Using PubSub emulator at {PUBSUB_EMULATOR_HOST}")
    # Set emulator host for the client
    os.environ["PUBSUB_EMULATOR_HOST"] = PUBSUB_EMULATOR_HOST

# Create topic and subscription if they don't exist
publisher_client = pubsub_v1.PublisherClient()
subscriber_client = pubsub_v1.SubscriberClient()

topic_path = publisher_client.topic_path(PROJECT_ID, "goal-events")
subscription_path = subscriber_client.subscription_path(PROJECT_ID, "goal-events-sub")

try:
    publisher_client.create_topic(request={"name": topic_path})
    print(f"Created topic: {topic_path}")
except Exception as e:
    if "already exists" in str(e).lower():
        print(f"Topic already exists: {topic_path}")
    else:
        print(f"Error creating topic: {e}")

try:
    subscriber_client.create_subscription(
        request={"name": subscription_path, "topic": topic_path}
    )
    print(f"Created subscription: {subscription_path}")
except Exception as e:
    if "already exists" in str(e).lower():
        print(f"Subscription already exists: {subscription_path}")
    else:
        print(f"Error creating subscription: {e}")

# Databricks SQL client (optional for development)
conn = None
if os.getenv("DATABRICKS_HOST") and os.getenv("DATABRICKS_HTTP_PATH") and os.getenv("DATABRICKS_TOKEN"):
    try:
        conn = sql.connect(
            server_hostname=os.getenv("DATABRICKS_HOST"),
            http_path=os.getenv("DATABRICKS_HTTP_PATH"),
            access_token=os.getenv("DATABRICKS_TOKEN"),
        )
        print("Connected to Databricks")
    except Exception as e:
        print(f"Failed to connect to Databricks: {e}")
        print("Running in development mode without Databricks")
else:
    print("Databricks credentials not found, running in development mode")

def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    data = json.loads(message.data.decode("utf-8"))
    print(f"Received event: {data}")
    
    if conn:
        # write to Databricks table (Delta Lake)
        df = pd.json_normalize(data)
        df.to_sql(name="goal_events", con=conn, if_exists="append", index=False)
        print("Event written to Databricks")
    else:
        # Development mode - just log the event
        print(f"Development mode: Event would be written to Databricks: {data}")
    
    message.ack()

streaming_future = subscriber_client.subscribe(subscription_path, callback=callback)
print("Listening for messages on {}".format(subscription_path))

try:
    streaming_future.result()
except KeyboardInterrupt:
    streaming_future.cancel()
