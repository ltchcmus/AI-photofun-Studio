import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import io from 'socket.io-client'

export default function CommentTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [postId, setPostId] = useState('')
  const [commentId, setCommentId] = useState('')
  const [createData, setCreateData] = useState({
    postId: '', userId: '', userName: '', content: ''
  })
  const [updateContent, setUpdateContent] = useState('')
  const [socket, setSocket] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketMessages, setSocketMessages] = useState([])
  const socketRef = useRef(null) // Prevent multiple socket instances

  // Socket.IO connection - Socket.IO v2.x compatible
  useEffect(() => {
    // Prevent creating multiple sockets
    if (socketRef.current) {
      console.log('⚠️ Socket already exists, skipping creation')
      return
    }

    console.log('🔌 Initializing socket connection...')
    
    const newSocket = io('http://localhost:8003', {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
      autoConnect: true,
      forceNew: false, // Don't create new connection if one exists
      path: '/socket.io' // Explicitly set path for v2.x
    })

    newSocket.on('connect', () => {
      console.log('✅ Connected to comments socket:', newSocket.id)
      setSocketConnected(true)
      addSocketMessage('✅ Connected to socket server (ID: ' + newSocket.id + ')')
    })

    newSocket.on('connect_ack', (data) => {
      console.log('Server acknowledged connection:', data)
      addSocketMessage(`🤝 Server ACK: ${data.status}`)
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

    newSocket.on('joined', (data) => {
      console.log('✅ Joined room:', data)
      addSocketMessage(`✅ Joined room: ${data.postId}`)
    })

    newSocket.on('left', (data) => {
      console.log('✅ Left room:', data)
      addSocketMessage(`✅ Left room: ${data.postId}`)
    })

    newSocket.on('new_comment', (data) => {
      console.log('📝 New comment received:', data)
      addSocketMessage(`📝 New comment: ${data.content} (by ${data.userName})`)
    })

    newSocket.on('update_comment', (data) => {
      console.log('✏️ Comment updated:', data)
      addSocketMessage(`✏️ Comment updated: ${data.content}`)
    })

    newSocket.on('delete_comment', (data) => {
      console.log('🗑️ Comment deleted:', data)
      addSocketMessage(`🗑️ Comment deleted: ${data.id}`)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Cleanup: disconnect when component unmounts
    return () => {
      console.log('🔌 Cleaning up socket connection...')
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, []) // EMPTY DEPENDENCY - only run once!

  const addSocketMessage = (msg) => {
    setSocketMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  const apiCall = async (method, endpoint, data = null) => {
    setLoading(true)
    try {
      const res = await axios({
        method,
        url: `http://localhost:8003${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`
        }
      })
      setResponse(JSON.stringify(res.data, null, 2))
    } catch (err) {
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    if (socket && postId) {
      socket.emit('join', postId)
      addSocketMessage(`🚪 Joined room: ${postId}`)
    }
  }

  const leaveRoom = () => {
    if (socket && postId) {
      socket.emit('leave', postId)
      addSocketMessage(`🚪 Left room: ${postId}`)
    }
  }

  return (
    <div>
      <div className="api-section">
        <h3>🔌 Socket.IO Status</h3>
        <p>Status: <strong style={{color: socketConnected ? 'green' : 'red'}}>
          {socketConnected ? 'Connected' : 'Disconnected'}
        </strong></p>
        <div className="form-row">
          <input placeholder="Post ID for room" value={postId} 
            onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-primary" onClick={joinRoom} disabled={!socketConnected}>
            Join Room
          </button>
          <button className="btn btn-secondary" onClick={leaveRoom} disabled={!socketConnected}>
            Leave Room
          </button>
        </div>
        <div style={{
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px', 
          maxHeight: '150px', 
          overflowY: 'auto',
          fontSize: '12px',
          marginTop: '10px'
        }}>
          {socketMessages.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>
      </div>

      <div className="api-section">
        <h3>💬 Get Comments by Post (API #46)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/comments/post/${postId}`)} disabled={loading}>
            Get Comments
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 Get Comment by ID (API #47)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/comments/${commentId}`)} disabled={loading}>
            Get Comment
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>➕ Create Comment (API #48)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={createData.postId}
            onChange={(e) => setCreateData({...createData, postId: e.target.value})} />
          <input placeholder="User ID" value={createData.userId}
            onChange={(e) => setCreateData({...createData, userId: e.target.value})} />
          <input placeholder="User Name" value={createData.userName}
            onChange={(e) => setCreateData({...createData, userName: e.target.value})} />
          <input placeholder="Content" value={createData.content}
            onChange={(e) => setCreateData({...createData, content: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={() => apiCall('POST', '/comments', createData)} disabled={loading}>
          Create Comment
        </button>
      </div>

      <div className="api-section">
        <h3>✏️ Update Comment (API #49)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <input placeholder="New Content" value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('PUT', `/comments/${commentId}`, {
            content: updateContent
          })} disabled={loading}>Update</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete Comment (API #50)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <button className="btn btn-danger" onClick={() => {
            if (window.confirm('Delete this comment?')) apiCall('DELETE', `/comments/${commentId}`)
          }} disabled={loading}>Delete Comment</button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
