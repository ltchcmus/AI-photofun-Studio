import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

export default function CommunicationTab({ config, auth, apiClient }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [socket, setSocket] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketMessages, setSocketMessages] = useState([])
  const socketRef = useRef(null)

  // 1-1 Chat
  const [receiverId, setReceiverId] = useState('')
  const [message, setMessage] = useState('')
  
  // Group Chat
  const [groupId, setGroupId] = useState('')
  const [groupMessage, setGroupMessage] = useState('')
  const [groupName, setGroupName] = useState('')

  // Socket.IO connection - Compatible with netty-socketio
  useEffect(() => {
    if (socketRef.current) {
      console.log('⚠️ Socket already exists, skipping creation')
      return
    }

    if (!auth.userId) {
      console.log('⚠️ No userId, skipping socket connection')
      return
    }

    console.log('🔌 Initializing communication socket...')
    
    const newSocket = io(`http://localhost:8899?userId=${auth.userId}`, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      forceNew: false,
      path: '/socket.io'
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to communication socket:', newSocket.id)
      setSocketConnected(true)
      addSocketMessage('✅ Connected (auto-joined your groups)')
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket:', reason)
      setSocketConnected(false)
      addSocketMessage(`❌ Disconnected: ${reason}`)
    })

    newSocket.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error)
      addSocketMessage(`🔥 Connection error: ${error.message || error}`)
    })

    newSocket.on('error', (error) => {
      console.error('⚠️ Socket error:', error)
      addSocketMessage(`⚠️ Error: ${error.message || error}`)
    })

    newSocket.on('receiveMessage', (data) => {
      console.log('📨 Received 1-1 message:', data)
      addSocketMessage(`📨 From ${data.senderId}: ${data.message}`)
    })

    newSocket.on('receiveGroupMessage', (data) => {
      console.log('📨 Received group message:', data)
      addSocketMessage(`📨 [Group ${data.groupId}] From ${data.senderId}: ${data.message}`)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      console.log('🔌 Cleaning up socket connection...')
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [auth.userId])

  const addSocketMessage = (msg) => {
    setSocketMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const apiCall = async (method, endpoint, data = null, params = {}) => {
    setLoading(true)
    try {
      const res = await apiClient({
        method,
        url: endpoint,
        data,
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      setResponse(JSON.stringify(res.data, null, 2))
    } catch (err) {
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  // Socket actions
  const sendDirectMessage = () => {
    if (!socket || !socketConnected) {
      alert('Connect to socket first')
      return
    }
    if (!receiverId || !message) {
      alert('Fill in receiver ID and message')
      return
    }

    const data = {
      senderId: auth.userId,
      receiverId: receiverId,
      message: message,
      isImage: false
    }
    socket.emit('sendMessage', data)
    addSocketMessage(`📤 Sent to ${receiverId}: ${message}`)
    setMessage('')
  }

  const sendGroupMsg = () => {
    if (!socket || !socketConnected) {
      alert('Connect to socket first')
      return
    }
    if (!groupId || !groupMessage) {
      alert('Fill in group ID and message')
      return
    }

    const data = {
      senderId: auth.userId,
      groupId: groupId,
      message: groupMessage,
      isImage: false
    }
    socket.emit('sendMessageToGroup', data)
    addSocketMessage(`📤 Sent to group ${groupId}: ${groupMessage}`)
    setGroupMessage('')
  }

  const joinRoom = () => {
    if (!socket || !socketConnected) {
      alert('Connect to socket first')
      return
    }
    if (!groupId) {
      alert('Enter group ID')
      return
    }
    socket.emit('joinRoom', groupId)
    addSocketMessage(`🚪 Manually joined group: ${groupId}`)
  }

  const leaveRoom = () => {
    if (!socket || !socketConnected) {
      alert('Connect to socket first')
      return
    }
    if (!groupId) {
      alert('Enter group ID')
      return
    }
    socket.emit('leaveRoom', groupId)
    addSocketMessage(`🚪 Left group: ${groupId}`)
  }

  return (
    <div>
      {/* Socket Status */}
      <div className="api-section">
        <h3>🔌 Communication Socket.IO Status</h3>
        <p>Status: <strong style={{color: socketConnected ? 'green' : 'red'}}>
          {socketConnected ? 'Connected' : 'Disconnected'}
        </strong></p>
        {!auth.userId && <p style={{color: 'orange'}}>⚠️ Please login first to use chat</p>}
        {auth.userId && <p>👤 Your User ID: <code>{auth.userId}</code></p>}
      </div>

      {/* 1-1 Chat */}
      <div className="api-section">
        <h3>💬 1-1 Direct Message</h3>
        <div className="form-row">
          <input 
            placeholder="Receiver User ID" 
            value={receiverId} 
            onChange={(e) => setReceiverId(e.target.value)} 
          />
          <input 
            placeholder="Message" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && sendDirectMessage()}
          />
          <button className="btn btn-primary" onClick={sendDirectMessage} disabled={!socketConnected}>
            Send Message
          </button>
        </div>
      </div>

      {/* Group Chat */}
      <div className="api-section">
        <h3>👥 Group Chat</h3>
        <div className="form-row">
          <input 
            placeholder="Group ID" 
            value={groupId} 
            onChange={(e) => setGroupId(e.target.value)} 
          />
          <button className="btn btn-secondary" onClick={joinRoom} disabled={!socketConnected}>
            Join Room
          </button>
          <button className="btn btn-secondary" onClick={leaveRoom} disabled={!socketConnected}>
            Leave Room
          </button>
        </div>
        <div className="form-row">
          <input 
            placeholder="Group Message" 
            value={groupMessage} 
            onChange={(e) => setGroupMessage(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && sendGroupMsg()}
          />
          <button className="btn btn-primary" onClick={sendGroupMsg} disabled={!socketConnected}>
            Send to Group
          </button>
        </div>
      </div>

      {/* Socket Message Log */}
      <div className="api-section">
        <h3>📋 Socket Messages</h3>
        <div style={{
          maxHeight: '200px', 
          overflow: 'auto', 
          border: '1px solid #ddd', 
          padding: '10px',
          backgroundColor: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#000000',
          borderRadius: '4px'
        }}>
          {socketMessages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
          {socketMessages.length === 0 && <div style={{color: '#999'}}>No messages yet...</div>}
        </div>
        <button className="btn btn-secondary" onClick={() => setSocketMessages([])}>
          Clear Log
        </button>
      </div>

      {/* Conversation Management */}
      <div className="api-section">
        <h3>👤 My Conversations</h3>
        <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/communications/conversations/my-conversations')} disabled={loading}>
          Get My Conversations
        </button>
      </div>

      <div className="api-section">
        <h3>➕ Add Conversation</h3>
        <div className="form-row">
          <input placeholder="Receiver User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-success" onClick={() => apiCall('POST', `/api/v1/communications/conversations/add?receiverId=${receiverId}`)} disabled={loading || !receiverId}>
            Add Conversation
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete Conversation</h3>
        <div className="form-row">
          <input placeholder="Receiver User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-danger" onClick={() => apiCall('DELETE', `/api/v1/communications/conversations/delete?receiverId=${receiverId}`)} disabled={loading || !receiverId}>
            Delete Conversation
          </button>
        </div>
      </div>

      {/* Group Management */}
      <div className="api-section">
        <h3>🏢 Create Group (Premium Only)</h3>
        <div className="form-row">
          <input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('POST', '/api/v1/communications/groups/create', null, { groupName })} disabled={loading}>
            Create Group
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>📜 Get All Groups</h3>
        <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/communications/groups/all', null, { page: 1, size: 10 })} disabled={loading}>
          Get All Groups
        </button>
      </div>

      <div className="api-section">
        <h3>🔍 Get Group Messages</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/api/v1/communications/groups/${groupId}/messages`, null, { page: 1, size: 20 })} disabled={loading || !groupId}>
            Get Messages
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>📬 Get 1-1 Messages</h3>
        <div className="form-row">
          <input placeholder="Other User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/communications/communications/get-messages', null, { receiverId, page: 1, size: 15 })} disabled={loading || !receiverId}>
            Get Messages
          </button>
        </div>
      </div>

      {/* Response */}
      <div className="api-section">
        <h3>📥 API Response</h3>
        <pre className="response-box">{response || 'No response yet...'}</pre>
      </div>
    </div>
  )
}
