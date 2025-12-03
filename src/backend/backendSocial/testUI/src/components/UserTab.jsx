import React, { useState } from 'react'
import axios from 'axios'

export default function UserTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [postId, setPostId] = useState('')
  const [postIds, setPostIds] = useState('')
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })

  const apiCall = async (method, endpoint, data = null, isFile = false) => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${auth.accessToken}` }
      if (!isFile) headers['Content-Type'] = 'application/json'

      const res = await axios({
        method,
        url: `${config.apiGateway}${endpoint}`,
        data,
        headers,
        withCredentials: true
      })
      setResponse(JSON.stringify(res.data, null, 2))
    } catch (err) {
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    await apiCall('POST', '/api/v1/identity/users/upload-avatar', formData, true)
  }

  return (
    <div>
      <div className="api-section">
        <h3>👤 User Info</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/users/me')} disabled={loading}>
            Get My Info (API #6)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/users/get-all')} disabled={loading}>
            Get All Users (API #7)
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 Get User By ID (API #8)</h3>
        <div className="form-row">
          <input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/api/v1/identity/users/get/${userId}`)} disabled={loading}>
            Get User
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔒 Change Password (API #9)</h3>
        <div className="form-row">
          <input type="password" placeholder="Old Password" value={passwords.old}
            onChange={(e) => setPasswords({...passwords, old: e.target.value})} />
          <input type="password" placeholder="New Password" value={passwords.new}
            onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
          <input type="password" placeholder="Confirm" value={passwords.confirm}
            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
        </div>
        <button className="btn btn-primary" onClick={() => apiCall('POST', '/api/v1/identity/users/change-password', {
          oldPassword: passwords.old,
          newPassword: passwords.new,
          confirmPassword: passwords.confirm
        })} disabled={loading}>Change Password</button>
      </div>

      <div className="api-section">
        <h3>📷 Upload Avatar (API #10)</h3>
        <input type="file" onChange={uploadAvatar} accept="image/*" />
      </div>

      <div className="api-section">
        <h3>❤️ Like Post (API #11)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('POST', `/api/v1/identity/users/click-like/${postId}`)} disabled={loading}>
            Like Post
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>✅ Check Liked Posts (API #14)</h3>
        <div className="form-row">
          <input placeholder="Post IDs (comma separated)" value={postIds} 
            onChange={(e) => setPostIds(e.target.value)} />
          <button className="btn btn-primary" onClick={() => {
            const ids = postIds.split(',').map(id => id.trim()).filter(id => id);
            apiCall('POST', '/api/v1/identity/users/check-liked-posts', ids);
          }} disabled={loading}>
            Check Liked Status
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 Other User Operations</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/users/check-login-by-google')} disabled={loading}>
            Check Google Login (API #12)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/users/check-premium')} disabled={loading}>
            Check Premium (API #13)
          </button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
