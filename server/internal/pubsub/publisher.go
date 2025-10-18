package pubsub

import (
	"context"
	"encoding/json"

	"cloud.google.com/go/pubsub"
)

type Publisher struct {
	topic *pubsub.Topic
}

func NewPublisher(ctx context.Context, client *pubsub.Client, topicID string) *Publisher {
	topic := client.Topic(topicID)
	return &Publisher{topic: topic}
}

func (p *Publisher) Publish(ctx context.Context, event interface{}) error {
	// Skip publishing if topic is nil (for testing)
	if p.topic == nil {
		return nil
	}

	data, err := json.Marshal(event)
	if err != nil {
		return err
	}
	result := p.topic.Publish(ctx, &pubsub.Message{Data: data})
	_, err = result.Get(ctx)
	return err
}
