package main

import (
	"service/comments/internal/app"
)

func main() {
	application := app.NewApplication()
	application.Run()
}
