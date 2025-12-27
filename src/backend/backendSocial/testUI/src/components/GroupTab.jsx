import React, { useState } from 'react'

export default function GroupTab({ config, auth, apiClient }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [createData, setCreateData] = useState({ name: '', image: '' })
  const [groupId, setGroupId] = useState('')
  const [updateData, setUpdateData] = useState({ name: '', description: '' })
  const [requestData, setRequestData] = useState({ requestId: '', groupId: '', accept: 'true' })

  const apiCall = async (method, endpoint, data = null, isFile = false) => {
    setLoading(true)
    try {
      const config = {
        method,
        url: endpoint,
        data
      }
      
      if (!isFile) {
        config.headers = { 'Content-Type': 'application/json' }
      }

      const res = await apiClient(config)
      setResponse(JSON.stringify(res.data, null, 2))
    } catch (err) {
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const uploadGroupAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    await apiCall('POST', `/api/v1/communications/groups/${groupId}/avatar`, formData, true)
  }

  return (
    <div>
      <div className="api-section">
        <h3>👥 View Groups</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/communications/groups/all?page=1&size=20')} disabled={loading}>
            Get All Groups (API #14)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/identity/users/get-group-joined?page=1&size=20')} disabled={loading}>
            Get My Groups (API #15)
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 Get Group Detail (API #16)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/api/v1/communications/groups/${groupId}`)} disabled={loading}>
            Get Detail
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>➕ Create Group (API #17 - Premium Only)</h3>
        <div className="form-row">
          <input placeholder="Group Name" value={createData.name}
            onChange={(e) => setCreateData({...createData, name: e.target.value})} />
          <input placeholder="Image URL (optional)" value={createData.image}
            onChange={(e) => setCreateData({...createData, image: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={() => {
          const url = `/api/v1/communications/groups/create?groupName=${encodeURIComponent(createData.name)}${createData.image ? '&imageUrl=' + encodeURIComponent(createData.image) : ''}`
          apiCall('POST', url)
        }} disabled={loading}>Create Group</button>
      </div>

      <div className="api-section">
        <h3>✏️ Update Group (API #18 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <input placeholder="New Name" value={updateData.name}
            onChange={(e) => setUpdateData({...updateData, name: e.target.value})} />
          <input placeholder="New Description" value={updateData.description}
            onChange={(e) => setUpdateData({...updateData, description: e.target.value})} />
        </div>
        <button className="btn btn-primary" onClick={() => apiCall('PATCH', `/api/v1/communications/groups/${groupId}`, updateData)} disabled={loading}>
          Update Group
        </button>
      </div>

      <div className="api-section">
        <h3>📷 Upload Group Avatar (API #19 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <input type="file" onChange={uploadGroupAvatar} accept="image/*" />
        </div>
      </div>

      <div className="api-section">
        <h3>📥 Request to Join Group (API #20)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('POST', `/api/v1/communications/groups/request-join-group?groupId=${groupId}`)} disabled={loading}>
            Request Join
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>📋 Get Member Requests (API #21)</h3>
        <button className="btn btn-primary" onClick={() => apiCall('PATCH', '/api/v1/identity/users/get-request-join-group?page=1&size=20')} disabled={loading}>
          Get Requests
        </button>
      </div>

      <div className="api-section">
        <h3>✅ Accept/Deny Request (API #22 - Admin Only)</h3>
        <div className="form-row">
          <input placeholder="Request ID" value={requestData.requestId}
            onChange={(e) => setRequestData({...requestData, requestId: e.target.value})} />
          <input placeholder="Group ID" value={requestData.groupId}
            onChange={(e) => setRequestData({...requestData, groupId: e.target.value})} />
          <select value={requestData.accept} onChange={(e) => setRequestData({...requestData, accept: e.target.value})}>
            <option value="true">Accept</option>
            <option value="false">Deny</option>
          </select>
          <button className="btn btn-primary" onClick={() => {
            const url = `/api/v1/communications/groups/modify-request-status?requestId=${requestData.requestId}&groupId=${requestData.groupId}&accept=${requestData.accept}`
            apiCall('PATCH', url)
          }} disabled={loading}>Modify Request</button>
        </div>
      </div>

      <div className="api-section">
        <h3>💬 Get Group Messages (API #23)</h3>
        <div className="form-row">
          <input placeholder="Group ID" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/api/v1/communications/groups/${groupId}/messages?page=1&size=50`)} disabled={loading}>
            Get Messages
          </button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
