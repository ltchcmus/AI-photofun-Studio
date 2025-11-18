import React, { useState } from 'react'
import axios from 'axios'

export default function CommentTab({ config, auth }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [postId, setPostId] = useState('')
  const [commentId, setCommentId] = useState('')
  const [createData, setCreateData] = useState({
    postId: '', userId: '', content: '', parentId: ''
  })
  const [updateContent, setUpdateContent] = useState('')

  const apiCall = async (method, endpoint, data = null) => {
    setLoading(true)
    try {
      const res = await axios({
        method,
        url: `${config.comments}${endpoint}`,
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
        <h3>💬 Get Comments by Post (API #35)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={postId} onChange={(e) => setPostId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/comments/post/${postId}`)} disabled={loading}>
            Get Comments
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔍 Get Comment by ID (API #36)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('GET', `/comments/${commentId}`)} disabled={loading}>
            Get Comment
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>➕ Create Comment (API #37)</h3>
        <div className="form-row">
          <input placeholder="Post ID" value={createData.postId}
            onChange={(e) => setCreateData({...createData, postId: e.target.value})} />
          <input placeholder="User ID" value={createData.userId}
            onChange={(e) => setCreateData({...createData, userId: e.target.value})} />
          <input placeholder="Content" value={createData.content}
            onChange={(e) => setCreateData({...createData, content: e.target.value})} />
          <input placeholder="Parent ID (optional)" value={createData.parentId}
            onChange={(e) => setCreateData({...createData, parentId: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={() => apiCall('POST', '/comments', createData)} disabled={loading}>
          Create Comment
        </button>
      </div>

      <div className="api-section">
        <h3>✏️ Update Comment (API #38)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <input placeholder="New Content" value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} />
          <button className="btn btn-primary" onClick={() => apiCall('PUT', `/comments/${commentId}`, {
            content: updateContent
          })} disabled={loading}>Update</button>
        </div>
      </div>

      <div className="api-section">
        <h3>🗑️ Delete Comment (API #39)</h3>
        <div className="form-row">
          <input placeholder="Comment ID" value={commentId} onChange={(e) => setCommentId(e.target.value)} />
          <button className="btn btn-danger" onClick={() => {
            if (confirm('Delete this comment?')) apiCall('DELETE', `/comments/${commentId}`)
          }} disabled={loading}>Delete Comment</button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
