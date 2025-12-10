import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export default function CommentTab({ config, auth, apiClient }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [postId, setPostId] = useState('test-post-123') // Default test post ID
  const [commentId, setCommentId] = useState('')
  const [createData, setCreateData] = useState({
    postId: 'test-post-123', // Default test post ID
    userId: 'user-001',
    userName: 'Test User',
    content: ''
  })
  const [updateContent, setUpdateContent] = useState('')
  const [socket, setSocket] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [socketMessages, setSocketMessages] = useState([])
  const [currentRoom, setCurrentRoom] = useState('') // Track current room
  const [comments, setComments] = useState([]) // Store comments for display
  const socketRef = useRef(null) // Prevent multiple socket instances

  // Native WebSocket connection
  useEffect(() => {
    // Prevent creating multiple websockets
    if (socketRef.current) {
      return
    }

    const ws = new WebSocket('ws://localhost:8003/ws')

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      setSocketConnected(true)
      addSocketMessage('✅ Connected')
      
      // Auto-join default room
      const defaultPostId = 'test-post-123'
      ws.send(JSON.stringify({ type: 'join', room: defaultPostId }))
      setCurrentRoom(defaultPostId)
      addSocketMessage(`🚪 Joined room: ${defaultPostId}`)
      loadExistingComments(defaultPostId)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'connect_ack':
            addSocketMessage('🤝 Server acknowledged')
            break

          case 'joined':
            addSocketMessage(`✅ Joined: ${message.data.postId}`)
            break

          case 'left':
            addSocketMessage(`👋 Left: ${message.data.postId}`)
            break

          case 'new_comment':
            console.log('📝 New comment:', message.data)
            addSocketMessage(`📝 New: ${message.data.content}`)
            
            setComments(prev => {
              const exists = prev.some(c => c.id === message.data.id)
              if (exists) return prev
              
              return [...prev, {
                id: message.data.id,
                userName: message.data.userName,
                userId: message.data.userId,
                content: message.data.content,
                createdAt: message.data.createdAt,
                isNew: true
              }]
            })
            
            setTimeout(() => {
              setComments(prev => prev.map(c => 
                c.id === message.data.id ? { ...c, isNew: false } : c
              ))
            }, 3000)
            break

          case 'update_comment':
            addSocketMessage(`✏️ Updated: ${message.data.id}`)
            setComments(prev => prev.map(c => 
              c.id === message.data.id ? { ...c, content: message.data.content, updatedAt: message.data.updatedAt } : c
            ))
            break

          case 'delete_comment':
            addSocketMessage(`🗑️ Deleted: ${message.data.id}`)
            setComments(prev => prev.filter(c => c.id !== message.data.id))
            break
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    ws.onclose = (event) => {
      console.log('❌ WebSocket closed')
      setSocketConnected(false)
      addSocketMessage('❌ Disconnected')
    }

    ws.onerror = () => {
      addSocketMessage('🔥 Connection error')
    }

    socketRef.current = ws
    setSocket(ws)

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [])

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
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('WebSocket not connected')
      return
    }

    if (!postId) {
      alert('Please enter a Post ID')
      return
    }

    // Send join message via WebSocket
    socket.send(JSON.stringify({ type: 'join', room: postId }))
    setCurrentRoom(postId)
    addSocketMessage(`🚪 Joining room: ${postId}`)
    
    // Load existing comments
    loadExistingComments(postId)
  }

  const leaveRoom = () => {
    if (socket && socket.readyState === WebSocket.OPEN && currentRoom) {
      socket.send(JSON.stringify({ type: 'leave', room: currentRoom }))
      addSocketMessage(`🚪 Leaving room: ${currentRoom}`)
      setCurrentRoom('')
      setComments([]) // Clear comments when leaving
    }
  }

  const loadExistingComments = async (postId) => {
    try {
      const res = await axios.get(`http://localhost:8003/comments/post/${postId}`)
      if (res.data.result && Array.isArray(res.data.result)) {
        const loadedComments = res.data.result.map(c => ({
          id: c.id,
          userName: c.userName,
          userId: c.userId,
          content: c.content,
          createdAt: c.createdAt,
          isNew: false
        }))
        setComments(loadedComments)
        addSocketMessage(`✅ Loaded ${loadedComments.length} existing comments`)
      } else {
        setComments([])
        addSocketMessage(`ℹ️ No existing comments found`)
      }
    } catch (err) {
      console.error('Failed to load comments:', err)
      setComments([])
      addSocketMessage(`⚠️ Failed to load comments: ${err.message}`)
    }
  }

  // Update createData.postId when postId changes
  useEffect(() => {
    setCreateData(prev => ({ ...prev, postId }))
  }, [postId])

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)' }}>
      {/* Left Panel - Comment Display */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', border: '2px solid #2196F3', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ background: '#2196F3', color: 'white', padding: '15px', fontWeight: 'bold', fontSize: '16px' }}>
          💬 Real-time Comments Preview
          {currentRoom && <span style={{ marginLeft: '10px', fontSize: '14px', opacity: 0.9 }}>
            (Room: {currentRoom})
          </span>}
        </div>
        
        {/* Comments Display Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
          background: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {!currentRoom ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
              <p style={{ fontSize: '48px', margin: '0' }}>💬</p>
              <p style={{ fontSize: '16px', marginTop: '10px' }}>Join a room to see comments</p>
              <p style={{ fontSize: '12px', color: '#666' }}>Enter a Post ID and click "Join Room" →</p>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
              <p style={{ fontSize: '48px', margin: '0' }}>📭</p>
              <p style={{ fontSize: '16px', marginTop: '10px' }}>No comments yet</p>
              <p style={{ fontSize: '12px', color: '#666' }}>Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment, idx) => (
              <div key={comment.id || idx} style={{
                background: 'white',
                border: comment.isNew ? '2px solid #4CAF50' : '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: comment.isNew ? '0 2px 8px rgba(76, 175, 80, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                animation: comment.isNew ? 'slideIn 0.3s ease-out' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#2196F3',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {comment.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{comment.userName || 'Anonymous'}</span>
                    {comment.isNew && <span style={{
                      background: '#4CAF50',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>NEW</span>}
                  </div>
                  <span style={{ fontSize: '11px', color: '#999' }}>
                    {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString() : 'Now'}
                  </span>
                </div>
                <div style={{ paddingLeft: '40px', color: '#555', fontSize: '14px', lineHeight: '1.5' }}>
                  {comment.content}
                </div>
                {comment.updatedAt && (
                  <div style={{ paddingLeft: '40px', fontSize: '10px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                    Edited at {new Date(comment.updatedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Comment Input */}
        {currentRoom && (
          <div style={{ padding: '15px', borderTop: '1px solid #e0e0e0', background: 'white' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="Type your comment..."
                value={createData.content}
                onChange={(e) => setCreateData({...createData, content: e.target.value})}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && createData.content.trim()) {
                    apiCall('POST', '/comments', createData)
                    setCreateData({...createData, content: ''})
                  }
                }}
              />
              <button
                style={{
                  padding: '10px 20px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
                onClick={() => {
                  if (createData.content.trim()) {
                    apiCall('POST', '/comments', createData)
                    setCreateData({...createData, content: ''})
                  }
                }}
                disabled={loading || !createData.content.trim()}
              >
                Send 📤
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Controls */}
      <div style={{ flex: '1', overflowY: 'auto' }}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div className="api-section">
        <h3>🔌 WebSocket Connection</h3>
        <p>Status: <strong style={{color: socketConnected ? '#4CAF50' : '#f44336'}}>
          {socketConnected ? '✅ Connected' : '❌ Disconnected'}
        </strong></p>
        {currentRoom && <p>Room: <strong style={{color: '#2196F3'}}>{currentRoom}</strong></p>}
        <div className="form-row">
          <input placeholder="Post ID" value={postId} 
            onChange={(e) => setPostId(e.target.value)}
            style={{ flex: 1 }} />
        </div>
        <div className="form-row">
          <button className="btn btn-primary" onClick={joinRoom} disabled={!socketConnected || currentRoom === postId}>
            {currentRoom === postId ? '✅ In Room' : '🚪 Join Room'}
          </button>
          <button className="btn btn-secondary" onClick={leaveRoom} disabled={!socketConnected || !currentRoom}>
            🚪 Leave Room
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>👤 Your Identity</h3>
        <div className="form-row">
          <input placeholder="User ID" value={createData.userId}
            onChange={(e) => setCreateData({...createData, userId: e.target.value})} />
        </div>
        <div className="form-row">
          <input placeholder="Your Name" value={createData.userName}
            onChange={(e) => setCreateData({...createData, userName: e.target.value})} />
        </div>
        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
          💡 Change your name to simulate different users
        </p>
      </div>

      <div className="api-section">
        <h3>📋 Event Log</h3>
        <div style={{
          background: '#ffffff',
          border: '1px solid #ddd',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#000000'
        }}>
          {socketMessages.length === 0 ? (
            <div style={{color: '#999'}}>Waiting for events...</div>
          ) : (
            socketMessages.slice(-20).map((msg, idx) => (
              <div key={idx} style={{padding: '2px 0', borderBottom: '1px dotted #eee'}}>{msg}</div>
            ))
          )}
        </div>
      </div>

      <div className="api-section">
        <h3>🧪 Advanced Testing</h3>
        <p style={{ fontSize: '12px', color: '#666' }}>Use these for detailed API testing</p>
        
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '5px', background: '#f0f0f0', borderRadius: '4px' }}>
            📝 Create Comment (Manual)
          </summary>
          <div style={{ marginTop: '10px' }}>
            <div className="form-row">
              <input placeholder="Post ID" value={createData.postId}
                onChange={(e) => setCreateData({...createData, postId: e.target.value})} />
            </div>
            <div className="form-row">
              <textarea placeholder="Comment content" value={createData.content}
                onChange={(e) => setCreateData({...createData, content: e.target.value})}
                style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
            </div>
            <button className="btn btn-success" onClick={() => {
              if (!createData.content.trim()) {
                alert('Please enter content!')
                return
              }
              apiCall('POST', '/comments', createData)
            }} disabled={loading}>Create</button>
          </div>
        </details>

        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '5px', background: '#f0f0f0', borderRadius: '4px' }}>
            ✏️ Update Comment
          </summary>
          <div style={{ marginTop: '10px' }}>
            <div className="form-row">
              <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
            </div>
            <div className="form-row">
              <input placeholder="New Content" value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => apiCall('PUT', `/comments/${commentId}`, {
              content: updateContent
            })} disabled={loading}>Update</button>
          </div>
        </details>

        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '5px', background: '#f0f0f0', borderRadius: '4px' }}>
            🗑️ Delete Comment
          </summary>
          <div style={{ marginTop: '10px' }}>
            <div className="form-row">
              <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
            </div>
            <button className="btn btn-danger" onClick={() => {
              if (window.confirm('Delete this comment?')) apiCall('DELETE', `/comments/${commentId}`)
            }} disabled={loading}>Delete</button>
          </div>
        </details>

        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', padding: '5px', background: '#f0f0f0', borderRadius: '4px' }}>
            🔍 Get Comments
          </summary>
          <div style={{ marginTop: '10px' }}>
            <div className="form-row">
              <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => apiCall('GET', `/comments/post/${postId}`)} disabled={loading}>
              Get Comments
            </button>
          </div>
        </details>
      </div>

      <div className="response-box">
        <strong>API Response:</strong>
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
    </div>
  )
}
