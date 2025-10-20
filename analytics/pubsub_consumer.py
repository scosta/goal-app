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

publisher = pubsub_v1.SubscriberClient()
subscription_path = publisher.subscription_path(PROJECT_ID, "goal-events-sub")

# Databricks SQL client
conn = sql.connect(
    server_hostname=os.getenv("DATABRICKS_HOST"),
    http_path=os.getenv("DATABRICKS_HTTP_PATH"),
    access_token=os.getenv("DATABRICKS_TOKEN"),
)

def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    data = json.loads(message.data.decode("utf-8"))
    # write to Databricks table (Delta Lake)
    df = pd.json_normalize(data)
    df.to_sql(name="goal_events", con=conn, if_exists="append", index=False)
    message.ack()

streaming_future = publisher.subscribe(subscription_path, callback=callback)
print("Listening for messages on {}".format(subscription_path))

try:
    streaming_future.result()
except KeyboardInterrupt:
    streaming_future.cancel()
