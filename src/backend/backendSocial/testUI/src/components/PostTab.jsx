import React, { useState } from 'react'
import axios from 'axios'

export default function PostTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [postId, setPostId] = useState('')
  const [createData, setCreateData] = useState({ caption: '', prompt: '' })
  const [likeData, setLikeData] = useState({ postId: '', like: 'true' })

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

  const createPost = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('caption', createData.caption)
    formData.append('prompt', createData.prompt)
    formData.append('image', file)
    
    await apiCall('POST', '/api/v1/posts/create', formData, true)
  }

  return (
    <div>
      <div className="api-section">
        <h3>📸 View Posts</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/posts/get-all?page=1&size=20')} disabled={loading}>
            Get All Posts (API #29)
          </button>
          <button className="btn btn-primary" onClick={() => apiCall('GET', '/api/v1/posts/my-posts?page=1&size=20')} disabled={loading}>
            Get My Posts (API #30)
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 View Post Detail (API #31)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/api/v1/posts/view/${postId}`)} disabled={loading}>
            View Post
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>➕ Create Post (API #32)</h3>
        <div className="form-row">
          <input placeholder="Caption" value={createData.caption}
            onChange={(e) => setCreateData({...createData, caption: e.target.value})} />
          <input placeholder="Prompt" value={createData.prompt}
            onChange={(e) => setCreateData({...createData, prompt: e.target.value})} />
          <input type="file" onChange={createPost} accept="image/*" />
        </div>
      </div>

      <div className="api-section">
        <h3>❤️ Like/Unlike Post (API #33)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={likeData.postId}
            onChange={(e) => setLikeData({...likeData, postId: e.target.value})} />
          <select value={likeData.like} onChange={(e) => setLikeData({...likeData, like: e.target.value})}>
            <option value="true">Like</option>
            <option value="false">Unlike</option>
          </select>
          <button className="btn btn-primary" onClick={() => {
            apiCall('PATCH', `/api/v1/posts/like?postId=${likeData.postId}&like=${likeData.like}`)
          }} disabled={loading}>Toggle Like</button>
        </div>
      </div>

      <div className="api-section">
        <h3>💾 Download Post (API #34)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-success" onClick={() => {
            window.open(`${config.apiGateway}/api/v1/posts/download/${postId}`, '_blank')
          }} disabled={loading}>Download</button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
