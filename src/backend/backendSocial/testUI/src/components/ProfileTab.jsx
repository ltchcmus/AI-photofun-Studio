import React, { useState } from 'react'
import axios from 'axios'

export default function ProfileTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [updateData, setUpdateData] = useState({
    fullName: '', phone: '', email: '', avatarUrl: ''
  })

  const apiCall = async (method, endpoint, data = null) => {
    setLoading(true)
    try {
      const res = await axios({
        method,
        url: `${config.apiGateway}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`
        },
        withCredentials: true
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
        <h3>📋 View Profile</h3>
        <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/profiles/my-profile')} disabled={loading}>
          Get My Profile (API #24)
        </button>
      </div>

      <div className="api-section">
        <h3>✏️ Update Profile (API #25)</h3>
        <div className="form-row">
          <input placeholder="Full Name" value={updateData.fullName}
            onChange={(e) => setUpdateData({...updateData, fullName: e.target.value})} />
          <input placeholder="Phone" value={updateData.phone}
            onChange={(e) => setUpdateData({...updateData, phone: e.target.value})} />
          <input placeholder="Email" value={updateData.email}
            onChange={(e) => setUpdateData({...updateData, email: e.target.value})} />
          <input placeholder="Avatar URL" value={updateData.avatarUrl}
            onChange={(e) => setUpdateData({...updateData, avatarUrl: e.target.value})} />
        </div>
        <button className="btn btn-primary" onClick={() => apiCall('PUT', '/api/v1/profiles/update', {
          ...updateData,
          verified: false
        })} disabled={loading}>Update Profile</button>
      </div>

      <div className="api-section">
        <h3>✅ Email Verification</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/profiles/check-verify')} disabled={loading}>
            Check Verify Status (API #26)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/profiles/verify-profile')} disabled={loading}>
            Send Verification Email (API #27)
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔐 Activate Profile (API #28)</h3>
        <div className="form-row">
          <input placeholder="Verification Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn btn-success" onClick={() => apiCall('PATCH', `/api/v1/profiles/activate-profile/${code}`)} disabled={loading}>
            Activate
          </button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
