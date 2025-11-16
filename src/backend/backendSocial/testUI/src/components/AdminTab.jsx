import React, { useState } from 'react'
import axios from 'axios'

export default function AdminTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [authorityData, setAuthorityData] = useState({ name: '', description: '' })
  const [roleData, setRoleData] = useState({ name: '', description: '', authorities: '' })
  const [deleteUserId, setDeleteUserId] = useState('')

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
        <h3>🔑 View Roles & Authorities</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/roles/get-all')} disabled={loading}>
            Get All Roles (API #52)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/authorities/get-all')} disabled={loading}>
            Get All Authorities (API #53)
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>➕ Create Authority (API #54 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="Authority Name" value={authorityData.name}
            onChange={(e) => setAuthorityData({...authorityData, name: e.target.value})} />
          <input placeholder="Description" value={authorityData.description}
            onChange={(e) => setAuthorityData({...authorityData, description: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={() => apiCall('POST', '/api/v1/identity/authorities/create', {
          authorityName: authorityData.name,
          description: authorityData.description
        })} disabled={loading}>Create Authority</button>
      </div>

      <div className="api-section">
        <h3>➕ Create Role (API #55 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="Role Name" value={roleData.name}
            onChange={(e) => setRoleData({...roleData, name: e.target.value})} />
          <input placeholder="Description" value={roleData.description}
            onChange={(e) => setRoleData({...roleData, description: e.target.value})} />
          <input placeholder="Authorities (comma-separated)" value={roleData.authorities}
            onChange={(e) => setRoleData({...roleData, authorities: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={() => {
          const authorities = roleData.authorities.split(',').map(a => a.trim()).filter(a => a)
          apiCall('POST', '/api/v1/identity/roles/create', {
            roleName: roleData.name,
            description: roleData.description,
            authorities
          })
        }} disabled={loading}>Create Role</button>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete User (API #56 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="User ID" value={deleteUserId} onChange={(e) => setDeleteUserId(e.target.value)} />
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Are you sure you want to delete this user?')) {
              apiCall('DELETE', `/api/v1/identity/users/delete/${deleteUserId}`)
            }
          }} disabled={loading}>Delete User</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete All Posts (API #57 - Admin Only)</h3>
        <button className="btn btn-danger" onClick={() => {
          if (confirm('⚠️ This will DELETE ALL POSTS! Are you absolutely sure?')) {
            apiCall('DELETE', '/api/v1/posts/delete-all')
          }
        }} disabled={loading}>Delete All Posts</button>
      </div>

      <div className="api-section">
        <h3>ℹ️ Note</h3>
        <p>These operations require <strong>ADMIN</strong> role.</p>
        <p>Make sure you are logged in as an admin user.</p>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
