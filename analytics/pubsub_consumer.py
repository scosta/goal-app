#!/usr/bin/env python3

import os
import json
from dotenv import load_dotenv
from google.cloud import pubsub_v1

# Optional imports for analytics
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas not available. Analytics will run in local-only mode.")

# Databricks import will be done conditionally later
DATABRICKS_AVAILABLE = False

# Load environment variables from .env file in project root
# Try .env.test first (for testing), then fall back to .env
if os.path.exists("../.env.test"):
    load_dotenv("../.env.test")
else:
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

# Databricks SQL client (optional)
conn = None

# Check if credentials exist and are not empty
host = os.getenv("DATABRICKS_HOST")
path = os.getenv("DATABRICKS_HTTP_PATH") 
token = os.getenv("DATABRICKS_TOKEN")

# Attempt Databricks connection if credentials are available
if host and path and token:
    try:
        from databricks import sql
        DATABRICKS_AVAILABLE = True
        
        # Use a timeout to prevent hanging on invalid credentials
        import signal
        
        def timeout_handler(signum, frame):
            raise TimeoutError("Databricks connection timed out")
        
        # Set a 5-second timeout
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(5)
        
        try:
            conn = sql.connect(
                server_hostname=host,
                http_path=path,
                access_token=token,
            )
            signal.alarm(0)  # Cancel the alarm
            print("Connected to Databricks - events will be written to database")
        except TimeoutError:
            print("Databricks connection timed out - likely invalid credentials")
            print("Running in local-only mode - events will only be logged")
            conn = None
        except Exception as e:
            signal.alarm(0)  # Cancel the alarm
            print(f"Failed to connect to Databricks: {e}")
            print("Running in local-only mode - events will only be logged")
            conn = None
            
    except ImportError:
        print("Warning: databricks-sql-connector not available. Running in local-only mode.")
        conn = None
    except Exception as e:
        print(f"Failed to connect to Databricks: {e}")
        print("Running in local-only mode - events will only be logged")
        conn = None
else:
    print("Databricks credentials not found - running in local-only mode")

def callback(message: pubsub_v1.subscriber.message.Message) -> None:
    data = json.loads(message.data.decode("utf-8"))
    
    # Enhanced logging with clear formatting
    print("=" * 50)
    print("🎯 RECEIVED EVENT")
    print("=" * 50)
    print(f"📅 Timestamp: {message.publish_time}")
    print(f"📝 Event Type: {data.get('type', 'unknown')}")
    print(f"📦 Payload:")
    
    # Pretty print the payload
    payload = data.get('payload', {})
    for key, value in payload.items():
        print(f"   {key}: {value}")
    
    print("-" * 50)
    
    if conn and PANDAS_AVAILABLE:
        # Write to Databricks table (Delta Lake)
        df = pd.json_normalize(data)
        df.to_sql(name="goal_events", con=conn, if_exists="append", index=False)
        print("✅ Event written to Databricks database")
    else:
        # Local-only mode - just log the event
        if not PANDAS_AVAILABLE:
            print("🔧 Local-only mode: pandas not available, event logged to console")
        elif not conn:
            print("🔧 Local-only mode: No Databricks connection, event logged to console")
        else:
            print("🔧 Local-only mode: Event logged to console (would be written to Databricks in production)")
    
    print("=" * 50)
    print()
    
    message.ack()

streaming_future = subscriber_client.subscribe(subscription_path, callback=callback)
print("Listening for messages on {}".format(subscription_path))

try:
    streaming_future.result()
except KeyboardInterrupt:
    streaming_future.cancel()
