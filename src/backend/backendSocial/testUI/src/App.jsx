import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'

// Import components
import AuthTab from './components/AuthTab'
import UserTab from './components/UserTab'
import GroupTab from './components/GroupTab'
import ProfileTab from './components/ProfileTab'
import PostTab from './components/PostTab'
import CommentTab from './components/CommentTab'
import ChatTab from './components/ChatTab'
import SocketTab from './components/SocketTab'
import AdminTab from './components/AdminTab'

function App() {
  const [activeTab, setActiveTab] = useState('auth')
  const [config, setConfig] = useState({
    apiGateway: 'http://localhost:8888',
    comments: 'http://localhost:8003',
    commSocket: 'http://localhost:8899'
  })
  
  const [auth, setAuth] = useState({
    accessToken: localStorage.getItem('accessToken') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    userId: localStorage.getItem('userId') || ''
  })

  const [sockets, setSockets] = useState({
    comments: null,
    communication: null
  })

  useEffect(() => {
    if (auth.accessToken) {
      localStorage.setItem('accessToken', auth.accessToken)
      localStorage.setItem('refreshToken', auth.refreshToken)
      localStorage.setItem('userId', auth.userId)
    } else {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userId')
    }
  }, [auth])

  const logout = () => {
    setAuth({ accessToken: '', refreshToken: '', userId: '' })
    if (sockets.comments) sockets.comments.disconnect()
    if (sockets.communication) sockets.communication.disconnect()
    setSockets({ comments: null, communication: null })
  }

  const tabs = [
    { id: 'auth', label: '🔐 Auth' },
    { id: 'user', label: '👤 User' },
    { id: 'group', label: '👥 Groups' },
    { id: 'profile', label: '📋 Profile' },
    { id: 'post', label: '📸 Posts' },
    { id: 'comment', label: '💬 Comments' },
    { id: 'chat', label: '💭 Chat' },
    { id: 'socket', label: '🔌 Sockets' },
    { id: 'admin', label: '⚙️ Admin' }
  ]

  return (
    <div className="app">
      <div className="header">
        <h1>🧪 API Testing Dashboard - 59 Endpoints</h1>
        <div className="auth-status">
          <span>
            {auth.accessToken ? `✅ Authenticated (User: ${auth.userId})` : '❌ Not Authenticated'}
          </span>
          {auth.accessToken && (
            <button className="btn btn-danger" onClick={logout}>Logout</button>
          )}
        </div>
      </div>

      <div className="config-section">
        <h3>⚙️ Configuration</h3>
        <div className="config-grid">
          <div className="form-group">
            <label>API Gateway URL</label>
            <input
              value={config.apiGateway}
              onChange={(e) => setConfig({...config, apiGateway: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Comments Service URL</label>
            <input
              value={config.comments}
              onChange={(e) => setConfig({...config, comments: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Communication Socket URL</label>
            <input
              value={config.commSocket}
              onChange={(e) => setConfig({...config, commSocket: e.target.value})}
            />
          </div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'auth' && <AuthTab config={config} auth={auth} setAuth={setAuth} />}
        {activeTab === 'user' && <UserTab config={config} auth={auth} />}
        {activeTab === 'group' && <GroupTab config={config} auth={auth} />}
        {activeTab === 'profile' && <ProfileTab config={config} auth={auth} />}
        {activeTab === 'post' && <PostTab config={config} auth={auth} />}
        {activeTab === 'comment' && <CommentTab config={config} auth={auth} />}
        {activeTab === 'chat' && <ChatTab config={config} auth={auth} />}
        {activeTab === 'socket' && <SocketTab config={config} auth={auth} sockets={sockets} setSockets={setSockets} />}
        {activeTab === 'admin' && <AdminTab config={config} auth={auth} />}
      </div>
    </div>
  )
}

export default App
