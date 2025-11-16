import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export default function SocketTab({ config, auth, sockets, setSockets }) {
  const [logs, setLogs] = useState([])
  const [commentsStatus, setCommentsStatus] = useState('disconnected')
  const [communicationStatus, setCommunicationStatus] = useState('disconnected')
  
  const [commentsRoom, setCommentsRoom] = useState('')
  const [socketUserId, setSocketUserId] = useState(auth.userId)
  const [messageData, setMessageData] = useState({
    receiverId: '', message: '', isImage: false
  })
  const [groupMessageData, setGroupMessageData] = useState({
    groupId: '', message: '', isImage: false
  })
  const [roomId, setRoomId] = useState('')

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { time, message, type }])
  }

  // Comments Socket
  const connectComments = () => {
    if (sockets.comments?.connected) {
      addLog('Already connected to Comments socket', 'error')
      return
    }

    const socket = io(config.comments)
    
    socket.on('connect', () => {
      addLog('✅ Connected to Comments Socket', 'info')
      setCommentsStatus('connected')
    })

    socket.on('disconnect', (reason) => {
      addLog(`❌ Disconnected from Comments: ${reason}`, 'error')
      setCommentsStatus('disconnected')
    })

    socket.on('error', (error) => {
      addLog(`⚠️ Comments Socket Error: ${error}`, 'error')
    })

    setSockets(prev => ({ ...prev, comments: socket }))
  }

  const disconnectComments = () => {
    if (sockets.comments) {
      sockets.comments.disconnect()
      setSockets(prev => ({ ...prev, comments: null }))
      setCommentsStatus('disconnected')
      addLog('Disconnected from Comments socket', 'info')
    }
  }

  const joinCommentsRoom = () => {
    if (!sockets.comments?.connected) {
      alert('Connect to socket first')
      return
    }
    sockets.comments.emit('join', commentsRoom)
    addLog(`📥 Joined comments room: ${commentsRoom}`, 'sent')
  }

  const leaveCommentsRoom = () => {
    if (!sockets.comments?.connected) {
      alert('Connect to socket first')
      return
    }
    sockets.comments.emit('leave', commentsRoom)
    addLog(`📤 Left comments room: ${commentsRoom}`, 'sent')
  }

  // Communication Socket
  const connectCommunication = () => {
    if (sockets.communication?.connected) {
      addLog('Already connected to Communication socket', 'error')
      return
    }

    const socket = io(`${config.commSocket}?userId=${socketUserId || auth.userId}`)
    
    socket.on('connect', () => {
      addLog('✅ Connected to Communication Socket', 'info')
      addLog('Auto-joined all your group rooms', 'info')
      setCommunicationStatus('connected')
    })

    socket.on('disconnect', (reason) => {
      addLog(`❌ Disconnected from Communication: ${reason}`, 'error')
      setCommunicationStatus('disconnected')
    })

    socket.on('receiveMessage', (data) => {
      addLog(`📨 Received 1-1: ${JSON.stringify(data)}`, 'received')
    })

    socket.on('receiveGroupMessage', (data) => {
      addLog(`📨 Received Group: ${JSON.stringify(data)}`, 'received')
    })

    socket.on('error', (error) => {
      addLog(`⚠️ Communication Socket Error: ${error}`, 'error')
    })

    setSockets(prev => ({ ...prev, communication: socket }))
  }

  const disconnectCommunication = () => {
    if (sockets.communication) {
      sockets.communication.disconnect()
      setSockets(prev => ({ ...prev, communication: null }))
      setCommunicationStatus('disconnected')
      addLog('Disconnected from Communication socket', 'info')
    }
  }

  const sendMessage = () => {
    if (!sockets.communication?.connected) {
      alert('Connect to socket first')
      return
    }
    const data = {
      senderId: auth.userId,
      receiverId: messageData.receiverId,
      message: messageData.message,
      isImage: messageData.isImage
    }
    sockets.communication.emit('sendMessage', data)
    addLog(`📤 Sent 1-1: ${JSON.stringify(data)}`, 'sent')
  }

  const sendGroupMessage = () => {
    if (!sockets.communication?.connected) {
      alert('Connect to socket first')
      return
    }
    const data = {
      senderId: auth.userId,
      groupId: groupMessageData.groupId,
      message: groupMessageData.message,
      isImage: groupMessageData.isImage
    }
    sockets.communication.emit('sendMessageToGroup', data)
    addLog(`📤 Sent Group: ${JSON.stringify(data)}`, 'sent')
  }

  const joinRoom = () => {
    if (!sockets.communication?.connected) {
      alert('Connect to socket first')
      return
    }
    sockets.communication.emit('joinRoom', roomId)
    addLog(`📥 Manually joined room: ${roomId}`, 'sent')
  }

  const leaveRoom = () => {
    if (!sockets.communication?.connected) {
      alert('Connect to socket first')
      return
    }
    sockets.communication.emit('leaveRoom', roomId)
    addLog(`📤 Left room: ${roomId}`, 'sent')
  }

  return (
    <div>
      <div className="api-section">
        <h3>🔌 Comments Socket (Port 8003) - API #42-45</h3>
        <div className="socket-status" style={{backgroundColor: commentsStatus === 'connected' ? '#28a745' : '#dc3545'}}>
          {commentsStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
        <div className="btn-group" style={{marginTop: '10px'}}>
          <button className="btn btn-success" onClick={connectComments}>Connect</button>
          <button className="btn btn-danger" onClick={disconnectComments}>Disconnect</button>
        </div>
        <div className="form-row" style={{marginTop: '15px'}}>
          <input placeholder="Post ID (room)" value={commentsRoom} 
            onChange={(e) => setCommentsRoom(e.target.value)} />
          <button className="btn btn-primary" onClick={joinCommentsRoom}>Join Room</button>
          <button className="btn btn-primary" onClick={leaveCommentsRoom}>Leave Room</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔌 Communication Socket (Port 8899) - API #46-51</h3>
        <div className="socket-status" style={{backgroundColor: communicationStatus === 'connected' ? '#28a745' : '#dc3545'}}>
          {communicationStatus === 'connected' ? 'Connected' : 'Disconnected'}
        </div>
        <div className="form-row" style={{marginTop: '10px'}}>
          <input placeholder="User ID" value={socketUserId} 
            onChange={(e) => setSocketUserId(e.target.value)} />
          <button className="btn btn-success" onClick={connectCommunication}>Connect</button>
          <button className="btn btn-danger" onClick={disconnectCommunication}>Disconnect</button>
        </div>
      </div>

      <div className="api-section">
        <h3>💭 Send 1-1 Message (Event: sendMessage)</h3>
        <div className="form-row">
          <input placeholder="Receiver ID" value={messageData.receiverId}
            onChange={(e) => setMessageData({...messageData, receiverId: e.target.value})} />
          <input placeholder="Message" value={messageData.message}
            onChange={(e) => setMessageData({...messageData, message: e.target.value})} />
          <label>
            <input type="checkbox" checked={messageData.isImage}
              onChange={(e) => setMessageData({...messageData, isImage: e.target.checked})} />
            Is Image
          </label>
          <button className="btn btn-primary" onClick={sendMessage}>Send</button>
        </div>
      </div>

      <div className="api-section">
        <h3>👥 Send Group Message (Event: sendMessageToGroup)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupMessageData.groupId}
            onChange={(e) => setGroupMessageData({...groupMessageData, groupId: e.target.value})} />
          <input placeholder="Message" value={groupMessageData.message}
            onChange={(e) => setGroupMessageData({...groupMessageData, message: e.target.value})} />
          <label>
            <input type="checkbox" checked={groupMessageData.isImage}
              onChange={(e) => setGroupMessageData({...groupMessageData, isImage: e.target.checked})} />
            Is Image
          </label>
          <button className="btn btn-primary" onClick={sendGroupMessage}>Send</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🚪 Manual Room Join/Leave</h3>
        <div className="form-row">
          <input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <button className="btn btn-primary" onClick={joinRoom}>Join Room</button>
          <button className="btn btn-primary" onClick={leaveRoom}>Leave Room</button>
        </div>
      </div>

      <div className="api-section">
        <h3>📜 Socket Logs</h3>
        <button className="btn btn-danger" onClick={() => setLogs([])}>Clear Logs</button>
        <div className="socket-logs" style={{marginTop: '10px'}}>
          {logs.map((log, idx) => (
            <div key={idx} className={`log-entry ${log.type}`}>
              <span style={{color: '#888'}}>[{log.time}]</span> {log.message}
            </div>
          ))}
          {logs.length === 0 && <div style={{color: '#666'}}>No logs yet...</div>}
        </div>
      </div>
    </div>
  )
}
