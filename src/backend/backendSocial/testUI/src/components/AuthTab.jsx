import React, { useState } from 'react'
import axios from 'axios'

export default function AuthTab({ config, auth, setAuth, apiClient, logout }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const [regData, setRegData] = useState({
    username: '', email: '', password: '', confirmPass: '', fullName: ''
  })

  const [loginData, setLoginData] = useState({
    usernameOrEmail: '', password: ''
  })

  const apiCall = async (method, endpoint, data = null, useInterceptor = true) => {
    setLoading(true)
    try {
      let res
      if (useInterceptor && apiClient) {
        // Use apiClient with interceptor
        res = await apiClient({
          method,
          url: endpoint,
          data
        })
      } else {
        // Direct axios call without interceptor (for login/register)
        res = await axios({
          method,
          url: `${config.apiGateway}${endpoint}`,
          data,
          headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
          withCredentials: true
        })
      }
      setResponse(JSON.stringify(res.data, null, 2))
      return res.data
    } catch (err) {
      setResponse(JSON.stringify(err.response?.data || { error: err.message }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const register = async () => {
    const result = await apiCall('POST', '/api/v1/identity/users/register', {
      ...regData,
      roles: ['USER']
    }, false) // Don't use interceptor for register
  }

  const login = async () => {
    const result = await apiCall('POST', '/api/v1/identity/auth/login', loginData, false) // Don't use interceptor for login
    if (result?.code === 1000) {
      // Backend only returns accessToken and expiresAt
      // RefreshToken and userId not in response
      const token = result.result.accessToken
      
      // Decode token to get userId (token payload has 'sub' claim)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setAuth({
          accessToken: token,
          refreshToken: token, // Use same token as refresh for now
          userId: payload.sub || 'unknown'
        })
      } catch (e) {
        // Fallback: just use token without userId
        setAuth({
          accessToken: token,
          refreshToken: token,
          userId: 'unknown'
        })
      }
    }
  }

  const introspect = async () => {
    await apiCall('GET', `/api/v1/identity/auth/introspect/${auth.accessToken}`)
  }

  const refresh = async () => {
    const result = await apiCall('GET', `/api/v1/identity/auth/refresh/${auth.refreshToken}`)
    if (result?.code === 1000) {
      setAuth({ ...auth, accessToken: result.result })
    }
  }

  const logoutApi = async () => {
    await apiCall('GET', '/api/v1/identity/auth/logout')
    logout()
  }

  return (
    <div>
      <div className="api-section">
        <h3>📝 Register (API #1)</h3>
        <div className="form-row">
          <input placeholder="Username" value={regData.username} 
            onChange={(e) => setRegData({...regData, username: e.target.value})} />
          <input placeholder="Email" value={regData.email}
            onChange={(e) => setRegData({...regData, email: e.target.value})} />
          <input type="password" placeholder="Password" value={regData.password}
            onChange={(e) => setRegData({...regData, password: e.target.value})} />
          <input type="password" placeholder="Confirm Password" value={regData.confirmPass}
            onChange={(e) => setRegData({...regData, confirmPass: e.target.value})} />
          <input placeholder="Full Name" value={regData.fullName}
            onChange={(e) => setRegData({...regData, fullName: e.target.value})} />
        </div>
        <button className="btn btn-primary" onClick={register} disabled={loading}>Register</button>
      </div>

      <div className="api-section">
        <h3>🔓 Login (API #2)</h3>
        <div className="form-row">
          <input placeholder="Username or Email" value={loginData.usernameOrEmail}
            onChange={(e) => setLoginData({...loginData, usernameOrEmail: e.target.value})} />
          <input type="password" placeholder="Password" value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
        </div>
        <button className="btn btn-success" onClick={login} disabled={loading}>Login</button>
      </div>

      <div className="api-section">
        <h3>🔍 Other Auth Operations</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={introspect} disabled={loading}>
            Introspect Token (API #3)
          </button>
          <button className="btn btn-primary" onClick={refresh} disabled={loading}>
            Refresh Token (API #4)
          </button>
          <button className="btn btn-danger" onClick={logoutApi} disabled={loading}>
            Logout API (API #5)
          </button>
        </div>
      </div>

      <div className="response-box">
        <pre>{response || 'Response will appear here...'}</pre>
      </div>
    </div>
  )
}
