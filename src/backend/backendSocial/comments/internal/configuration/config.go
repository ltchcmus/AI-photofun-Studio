package configuration

import (
	"os"
	"runtime"

	"github.com/joho/godotenv"
)

type Config struct {
	Port     string
	MongoURI string
}

var (
	config *Config
)

func LoadConfig() {

	_, pathCurrent, _, _ := runtime.Caller(0)
	pathRoot := pathCurrent[:len(pathCurrent)-len("internal/configuration/config.go")]
	pathEnv := pathRoot + ".env"
	err := godotenv.Load(pathEnv)

	if err != nil {
		panic("Error loading .env file")
	}

	config = &Config{
		Port:     GetEnv("PORT", "8003"),
		MongoURI: GetEnv("MONGO_URI", ""),
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
