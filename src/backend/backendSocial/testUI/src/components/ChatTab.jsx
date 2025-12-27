import React, { useState } from 'react'

export default function ChatTab({ config, auth, apiClient }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiverId, setReceiverId] = useState('')
  const [groupId, setGroupId] = useState('')

  const apiCall = async (method, endpoint, data = null) => {
    setLoading(true)
    try {
      const res = await apiClient({
        method,
        url: endpoint,
        data,
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

  return (
    <div>
      <div className="api-section">
        <h3>👤 My Conversations</h3>
        <button className="btn btn-primary" onClick={() => {
          apiCall('GET', '/api/v1/communications/conversations/my-conversations')
        }} disabled={loading}>Get My Conversations</button>
      </div>

      <div className="api-section">
        <h3>➕ Add Conversation</h3>
        <div className="form-row">
          <input placeholder="Receiver User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-success" onClick={() => {
            apiCall('POST', `/api/v1/communications/conversations/add?receiverId=${receiverId}`)
          }} disabled={loading || !receiverId}>Add Conversation</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete Conversation</h3>
        <div className="form-row">
          <input placeholder="Receiver User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Are you sure you want to delete this conversation?')) {
              apiCall('DELETE', `/api/v1/communications/conversations/delete?receiverId=${receiverId}`)
            }
          }} disabled={loading || !receiverId}>Delete Conversation</button>
        </div>
      </div>

      <div className="api-section">
        <h3>💭 Get 1-1 Chat Messages (API #40)</h3>
        <div className="form-row">
          <input placeholder="Receiver User ID" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            apiCall('GET', `/api/v1/communications/communications/get-messages?receiverId=${receiverId}&page=1&size=50`)
          }} disabled={loading}>Get Messages</button>
        </div>
      </div>

      <div className="api-section">
        <h3>👥 Get Group Chat Messages (API #41)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            apiCall('GET', `/api/v1/communications/groups/${groupId}/messages?page=1&size=50`)
          }} disabled={loading}>Get Group Messages</button>
        </div>
      </div>

      <div className="api-section">
        <h3>ℹ️ Note</h3>
        <p>To send messages in real-time, use the <strong>Sockets</strong> tab.</p>
        <p>These APIs only retrieve message history.</p>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
