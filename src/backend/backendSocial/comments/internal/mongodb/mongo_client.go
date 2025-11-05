package mongodb

import (
	"context"
	"fmt"
	"service/comments/internal/configuration"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client

func ConnectMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	clientOptions := options.Client().ApplyURI(configuration.GetMongoURI())
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		panic("Error connecting to MongoDB: " + err.Error())
	}

	if err := client.Ping(ctx, nil); err != nil {
		panic("Error pinging MongoDB: " + err.Error())
	}

	fmt.Println("Connected to MongoDB!")
	Client = client
}

func GetCollection(collectionName string) *mongo.Collection {
	databaseName := "NMCNPM_SOCIAL"
	collection := Client.Database(databaseName).Collection(collectionName)
	return collection
}
