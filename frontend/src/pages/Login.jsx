import { useState } from 'react'
import { useAuth } from '../utils/auth.jsx'
import { analytics } from '../utils/analytics'

function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [success, setSuccess] = useState('')
  
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const endpoint = isRegisterMode ? '/auth/register' : '/auth/login'
      const payload = isRegisterMode ? credentials : { username: credentials.username, password: credentials.password }
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (response.ok && !data.detail) {
        if (isRegisterMode) {
          analytics.trackRegistration(true, credentials.username)
          setSuccess('Registration successful! You can now login.')
          setIsRegisterMode(false)
          setCredentials({ username: credentials.username, password: '', email: '' })
        } else {
          // Проверяем наличие access_token перед логином
          if (data.access_token) {
            analytics.trackLogin(true, credentials.username)
            console.log('Login successful, token received')
            login(data.access_token)
          } else {
            console.error('No access token in response:', data)
            analytics.trackLogin(false, credentials.username)
            setError('Login failed - no token received')
          }
        }
      } else {
        console.log('Login failed:', data)
        if (isRegisterMode) {
          analytics.trackRegistration(false, credentials.username)
        } else {
          analytics.trackLogin(false, credentials.username)
        }
        setError(data.detail || `${isRegisterMode ? 'Registration' : 'Login'} failed`)
      }
    } catch (err) {
      setError('Network error. Please check API Gateway is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="floating-elements">
      <div className="container">
        <div className="login-form">
          <div className="card">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isRegisterMode ? '🚀 Create Account' : '🔐 Admin Panel Access'}
            </h2>
            
            {!isRegisterMode && (
              <div className="message-display" style={{ marginBottom: '2rem' }}>
                <strong>💡 Demo Credentials:</strong>
                <br />Username: admin
                <br />Password: admin
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {isRegisterMode && (
                <div className="form-group">
                  <label htmlFor="email">📧 Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={credentials.email}
                    onChange={handleChange}
                    required={isRegisterMode}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="username">👤 Username:</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">🔒 Password:</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {success && (
                <div className="message-display success">
                  ✅ {success}
                </div>
              )}
              
              {error && (
                <div className="error">❌ {error}</div>
              )}
              
              <button 
                type="submit" 
                className="btn"
                disabled={loading}
                style={{ width: '100%', marginTop: '1rem' }}
              >
                {loading ? (
                  isRegisterMode ? '⏳ Creating Account...' : '⏳ Logging in...'
                ) : (
                  isRegisterMode ? '🚀 Create Account' : '🔓 Login'
                )}
              </button>
            </form>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode)
                  setError('')
                  setSuccess('')
                  setCredentials({ username: '', password: '', email: '' })
                }}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                {isRegisterMode ? '🔙 Back to Login' : '📝 Create New Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login