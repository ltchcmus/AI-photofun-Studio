package main

import "service/comments/internal/app"

func main() {

	app := app.NewApplication()
	app.Run()
}
