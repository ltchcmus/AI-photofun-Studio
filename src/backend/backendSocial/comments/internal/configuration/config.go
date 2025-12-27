package configuration

import (
	"os"
	"runtime"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	MongoURI       string
	PostServiceURL string
}

var (
	config *Config
)

func LoadConfig() {

	_, pathCurrent, _, _ := runtime.Caller(0)
	pathRoot := pathCurrent[:len(pathCurrent)-len("internal/configuration/config.go")]
	pathEnv := pathRoot + ".env"

	// Try to load .env file, but don't panic if it doesn't exist
	// This allows environment variables to be set by Docker
	_ = godotenv.Load(pathEnv)

	config = &Config{
		Port:           GetEnv("PORT", "8003"),
		MongoURI:       GetEnv("MONGO_URI", "mongodb://admin:admin123@mongodb:27017/comments_db?authSource=admin"),
		PostServiceURL: GetEnv("POST_SERVICE_URL", "http://localhost:8082/posts"),
	}

}

func GetEnv(key, defaultValue string) string {
	//operator system contains environment variables
	value, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}
	return value
}

func GetPort() string {
	return config.Port
}
func GetMongoURI() string {
	return config.MongoURI
}
func GetPostServiceURL() string {
	return config.PostServiceURL
}
