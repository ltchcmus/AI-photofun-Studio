package handler

import (
	"fmt"

	socketio "github.com/googollee/go-socket.io"
)

func SetupSocketIO() *socketio.Server {
	server := socketio.NewServer(nil)

	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("Socket connected:", s.ID())
		return nil
	})

	// Join room theo postId
	server.OnEvent("/", "join", func(s socketio.Conn, postId string) {
		s.Join(postId)
		fmt.Printf("User %s joined room: %s\n", s.ID(), postId)
	})

	// Leave room
	server.OnEvent("/", "leave", func(s socketio.Conn, postId string) {
		s.Leave(postId)
		fmt.Printf("User %s left room: %s\n", s.ID(), postId)
	})

	server.OnError("/", func(s socketio.Conn, e error) {
		fmt.Println("Socket error:", e)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		fmt.Printf("Socket disconnected: %s, reason: %s\n", s.ID(), reason)
	})

	go server.Serve()

	return server
}
