package handler

import (
	"fmt"
	"net/http"

	socketio "github.com/googollee/go-socket.io"
	engineiio "github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/polling"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
)

func SetupSocketIO() *socketio.Server {
	// Configure EngineIO with CORS and transports
	opts := &engineiio.Options{
		Transports: []transport.Transport{
			&polling.Transport{
				CheckOrigin: func(r *http.Request) bool {
					return true // Allow all origins
				},
			},
			&websocket.Transport{
				CheckOrigin: func(r *http.Request) bool {
					return true // Allow all origins
				},
			},
		},
	}

	server := socketio.NewServer(opts)

	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("✅ Socket connected:", s.ID())
		// Send acknowledgement to client
		s.Emit("connect_ack", map[string]string{"status": "connected", "id": s.ID()})
		return nil
	})

	// Join room theo postId
	server.OnEvent("/", "join", func(s socketio.Conn, postId string) {
		s.Join(postId)
		fmt.Printf("🚪 User %s joined room: %s\n", s.ID(), postId)
		// Confirm join to client
		s.Emit("joined", map[string]string{"postId": postId})
	})

	// Leave room
	server.OnEvent("/", "leave", func(s socketio.Conn, postId string) {
		s.Leave(postId)
		fmt.Printf("🚪 User %s left room: %s\n", s.ID(), postId)
		// Confirm leave to client
		s.Emit("left", map[string]string{"postId": postId})
	})

	server.OnError("/", func(s socketio.Conn, e error) {
		fmt.Println("❌ Socket error:", e)
	})

	server.OnDisconnect("/", func(s socketio.Conn, reason string) {
		fmt.Printf("🔌 Socket disconnected: %s, reason: %s\n", s.ID(), reason)
	})

	// IMPORTANT: Start serving AFTER all events are registered
	go server.Serve()

	return server
}
