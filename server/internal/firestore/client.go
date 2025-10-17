package firestore

import (
	"context"

	"cloud.google.com/go/firestore"
)

func NewClient(ctx context.Context, projectID string) (*firestore.Client, error) {
	client, err := firestore.NewClient(ctx, projectID)
	if err != nil {
		return nil, err
	}
	return client, nil
}
