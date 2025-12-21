import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function AuthTab({ config, auth, setAuth, apiClient, logout, showSetPasswordModal, setShowSetPasswordModal }) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const [regData, setRegData] = useState({
    username: '', email: '', password: '', confirmPass: '', fullName: ''
  })

  const [loginData, setLoginData] = useState({
    usernameOrEmail: '', password: ''
  })

  const [googleConfig, setGoogleConfig] = useState({
    clientId: '424511485278-d36bocf4e3avqsadguauellt3gn4l412.apps.googleusercontent.com',
    redirectUri: 'http://localhost:8000/identity/auth/authentication'
  })

  const [setPasswordData, setSetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  // Check for Google login callback
  useEffect(() => {
    // Check if we're on the google-loading page (after Google redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    
    if (code) {
      setResponse(JSON.stringify({ 
        status: 'Google callback received', 
        code: code,
        message: 'Authorization code from Google. Backend will handle authentication.'
      }, null, 2))
    }
  }, [])

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

  const loginWithGoogle = () => {
    // Build Google OAuth2 URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleConfig.clientId)}&` +
      `redirect_uri=${encodeURIComponent(googleConfig.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}`
    
    setResponse(JSON.stringify({
      message: 'Redirecting to Google...',
      url: googleAuthUrl
    }, null, 2))
    
    // Open in new window or redirect
    window.location.href = googleAuthUrl
  }

  const checkLoginByGoogle = async () => {
    await apiCall('GET', '/api/v1/identity/users/check-login-by-google')
  }

  const setPassword = async () => {
    const result = await apiCall('POST', '/api/v1/identity/users/set-password', setPasswordData)
    if (result?.code === 1000) {
      // Password set successfully, close modal
      setShowSetPasswordModal(false)
      setSetPasswordData({ newPassword: '', confirmPassword: '' })
      alert('✅ Password set successfully! You can now login with username/password.')
    }
  }

  const getMe = async () => {
    await apiCall('GET', '/api/v1/identity/users/me')
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

      <div className="api-section" style={{backgroundColor: '#f0f8ff', border: '2px solid #4285f4'}}>
        <h3>🔵 Google Login (OAuth2)</h3>
        <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>
          ℹ️ Click button below to login with Google. You'll be redirected to Google login page.
        </p>
        
        <div className="form-row">
          <input 
            placeholder="Google Client ID" 
            value={googleConfig.clientId}
            onChange={(e) => setGoogleConfig({...googleConfig, clientId: e.target.value})}
            style={{fontSize: '0.85em'}}
          />
          <input 
            placeholder="Redirect URI" 
            value={googleConfig.redirectUri}
            onChange={(e) => setGoogleConfig({...googleConfig, redirectUri: e.target.value})}
            style={{fontSize: '0.85em'}}
          />
        </div>
        
        <div className="btn-group">
          <button 
            className="btn" 
            onClick={loginWithGoogle} 
            disabled={loading}
            style={{backgroundColor: '#4285f4', color: 'white', fontWeight: 'bold'}}
          >
            🔵 Login with Google
          </button>
          <button className="btn btn-primary" onClick={checkLoginByGoogle} disabled={loading}>
            ✓ Check if Login by Google
          </button>
          <button className="btn btn-primary" onClick={getMe} disabled={loading}>
            👤 Get My Info
          </button>
        </div>
      </div>

      <div className="api-section">
        <h3>🔑 Set Password (For Google Users)</h3>
        <p style={{fontSize: '0.9em', color: '#666', marginBottom: '10px'}}>
          ℹ️ Users who logged in with Google can set a password to enable username/password login.
        </p>
        <div className="form-row">
          <input 
            type="password" 
            placeholder="New Password" 
            value={setPasswordData.newPassword}
            onChange={(e) => setSetPasswordData({...setPasswordData, newPassword: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={setPasswordData.confirmPassword}
            onChange={(e) => setSetPasswordData({...setPasswordData, confirmPassword: e.target.value})}
          />
        </div>
        <button className="btn btn-warning" onClick={setPassword} disabled={loading}>
          Set Password
        </button>
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

      {/* Set Password Modal */}
      {showSetPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔑</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>Set Your Password</h2>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                You logged in with Google. Please set a password to enable username/password login.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                New Password
              </label>
              <input 
                type="password" 
                placeholder="Enter new password" 
                value={setPasswordData.newPassword}
                onChange={(e) => setSetPasswordData({...setPasswordData, newPassword: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                Confirm Password
              </label>
              <input 
                type="password" 
                placeholder="Confirm your password" 
                value={setPasswordData.confirmPassword}
                onChange={(e) => setSetPasswordData({...setPasswordData, confirmPassword: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={setPassword} 
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Setting...' : '✓ Set Password'}
              </button>
              <button 
                onClick={() => {
                  setShowSetPasswordModal(false)
                  setSetPasswordData({ newPassword: '', confirmPassword: '' })
                }}
                disabled={loading}
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Skip
              </button>
            </div>

            <p style={{ 
              marginTop: '20px', 
              fontSize: '12px', 
              color: '#999', 
              textAlign: 'center',
              margin: '15px 0 0 0'
            }}>
              You can set this later in the User settings
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
