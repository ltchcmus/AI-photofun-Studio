import React, { useEffect, useState } from 'react'

export default function GoogleCallback({ setAuth }) {
  const [status, setStatus] = useState('Processing Google login...')
  const [error, setError] = useState(null)

  useEffect(() => {
    // This component handles the callback after Google authentication
    // The backend should have already set the JWT cookie
    
    const handleCallback = async () => {
      try {
        // Check if we have cookies set by backend
        // The backend sets JWT token in httpOnly cookie after successful Google login
        
        // Try to get user info to verify authentication
        const response = await fetch('http://localhost:8888/api/v1/identity/users/me', {
          credentials: 'include', // Include cookies
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.code === 1000) {
            setStatus('✅ Google login successful!')
            
            // Note: We can't access httpOnly cookie from JS
            // But we can verify we're authenticated by calling /me endpoint
            // For testing UI, we'll just mark as authenticated
            setAuth({
              accessToken: 'google-authenticated', // Placeholder
              refreshToken: 'google-authenticated',
              userId: data.result.userId
            })
            
            setTimeout(() => {
              window.location.href = '/' // Redirect to main page
            }, 2000)
          } else {
            throw new Error('Failed to get user info')
          }
        } else {
          throw new Error('Authentication failed')
        }
      } catch (err) {
        setError(err.message)
        setStatus('❌ Google login failed')
        
        setTimeout(() => {
          window.location.href = '/' // Redirect back
        }, 3000)
      }
    }

    handleCallback()
  }, [setAuth])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {error ? '❌' : '🔵'}
        </div>
        <h2 style={{ color: error ? '#d32f2f' : '#4285f4', marginBottom: '10px' }}>
          {status}
        </h2>
        {error && (
          <p style={{ color: '#666', marginTop: '10px' }}>
            Error: {error}
          </p>
        )}
        <p style={{ color: '#666', marginTop: '20px', fontSize: '14px' }}>
          {error ? 'Redirecting back...' : 'Please wait...'}
        </p>
        <div style={{
          marginTop: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="spinner" style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #4285f4',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
