package websocket

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub maintains active clients and broadcasts messages to them
type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Room memberships: room -> clients
	rooms map[string]map[*Client]bool

	// Broadcast messages to all clients in a room
	broadcast chan *BroadcastMessage

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Room join requests
	joinRoom chan *RoomAction

	// Room leave requests
	leaveRoom chan *RoomAction

	mu sync.RWMutex
}

type BroadcastMessage struct {
	Room      string
	EventType string
	Data      interface{}
}

type RoomAction struct {
	Client *Client
	Room   string
}

var (
	instance *Hub
	once     sync.Once
)

// GetHub returns the singleton Hub instance
func GetHub() *Hub {
	once.Do(func() {
		instance = &Hub{
			clients:    make(map[*Client]bool),
			rooms:      make(map[string]map[*Client]bool),
			broadcast:  make(chan *BroadcastMessage, 256),
			register:   make(chan *Client),
			unregister: make(chan *Client),
			joinRoom:   make(chan *RoomAction),
			leaveRoom:  make(chan *RoomAction),
		}
		go instance.run()
	})
	return instance
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

			// Send connect acknowledgment
			ackMsg := Message{
				Type: "connect_ack",
				Data: map[string]interface{}{
					"status": "connected",
					"id":     client.ID,
				},
			}
			if jsonData, err := json.Marshal(ackMsg); err == nil {
				select {
				case client.Send <- jsonData:
				default:
					// Silently fail
				}
			}

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)

				// Remove from all rooms
				for room, clients := range h.rooms {
					delete(clients, client)
					if len(clients) == 0 {
						delete(h.rooms, room)
					}
				}
			}
			h.mu.Unlock()

		case action := <-h.joinRoom:
			h.mu.Lock()
			if h.rooms[action.Room] == nil {
				h.rooms[action.Room] = make(map[*Client]bool)
			}
			h.rooms[action.Room][action.Client] = true

			// Track rooms in client
			action.Client.Rooms[action.Room] = true
			h.mu.Unlock()

			// Send joined confirmation
			joinedMsg := Message{
				Type: "joined",
				Data: map[string]interface{}{
					"postId": action.Room,
				},
			}
			if jsonData, err := json.Marshal(joinedMsg); err == nil {
				select {
				case action.Client.Send <- jsonData:
				default:
					// Silently fail
				}
			}

		case action := <-h.leaveRoom:
			h.mu.Lock()
			if clients, ok := h.rooms[action.Room]; ok {
				delete(clients, action.Client)
				delete(action.Client.Rooms, action.Room)

				if len(clients) == 0 {
					delete(h.rooms, action.Room)
				}
			}
			h.mu.Unlock()

			// Send left confirmation
			leftMsg := Message{
				Type: "left",
				Data: map[string]interface{}{
					"postId": action.Room,
				},
			}
			if jsonData, err := json.Marshal(leftMsg); err == nil {
				select {
				case action.Client.Send <- jsonData:
				default:
					// Silently fail
				}
			}

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[msg.Room]
			count := 0

			// Create message envelope
			envelope := Message{
				Type: msg.EventType,
				Data: msg.Data,
			}

			jsonData, err := json.Marshal(envelope)
			if err != nil {
				fmt.Printf("❌ Failed to marshal broadcast message: %v\n", err)
				h.mu.RUnlock()
				continue
			}

			for client := range clients {
				select {
				case client.Send <- jsonData:
					count++
				default:
					fmt.Printf("⚠️ Failed to send to client %s, removing...\n", client.ID)
					close(client.Send)
					delete(h.clients, client)
					delete(h.rooms[msg.Room], client)
				}
			}

			fmt.Printf("📡 Broadcast '%s' to room '%s' - sent to %d clients\n", msg.EventType, msg.Room, count)
			h.mu.RUnlock()
		}
	}
}

// BroadcastToRoom sends a message to all clients in a specific room
func (h *Hub) BroadcastToRoom(room string, eventType string, data interface{}) {
	h.broadcast <- &BroadcastMessage{
		Room:      room,
		EventType: eventType,
		Data:      data,
	}
}

// RegisterClient registers a new client
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// UnregisterClient removes a client
func (h *Hub) UnregisterClient(client *Client) {
	h.unregister <- client
}

// JoinRoom adds a client to a room
func (h *Hub) JoinRoom(client *Client, room string) {
	h.joinRoom <- &RoomAction{
		Client: client,
		Room:   room,
	}
}

// LeaveRoom removes a client from a room
func (h *Hub) LeaveRoom(client *Client, room string) {
	h.leaveRoom <- &RoomAction{
		Client: client,
		Room:   room,
	}
}

// Client represents a WebSocket client
type Client struct {
	ID   string
	Conn *websocket.Conn
	Send chan []byte
	Hub  *Hub

	// Rooms this client is in
	Rooms map[string]bool
	mu    sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Type string      `json:"type"`
	Room string      `json:"room,omitempty"`
	Data interface{} `json:"data,omitempty"`
}
