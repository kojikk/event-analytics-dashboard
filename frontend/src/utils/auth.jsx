import { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// AuthContext для глобального состояния авторизации
const AuthContext = createContext({
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {}
})

// Ключ для localStorage
const TOKEN_KEY = 'analytics_token'

// Провайдер контекста авторизации
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // Проверяем токен при загрузке
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY)
      if (savedToken) {
        console.log('Validating saved token...')
        const ok = await validateToken(savedToken)
        if (ok) {
          console.log('Token is valid')
          setToken(savedToken)
          setIsAuthenticated(true)
        } else {
          console.log('Token is invalid, clearing...')
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setIsAuthenticated(false)
        }
      } else {
        console.log('No saved token found')
      }
      setLoading(false)
    }
    
    checkToken()
  }, [])

  const login = async (newToken) => {
    console.log('Logging in with new token')
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setIsAuthenticated(true)
    
    // Получаем информацию о пользователе после логина
    await fetchUserInfo(newToken)
    navigate('/admin')
  }

  const logout = () => {
    console.log('Logging out')
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setIsAuthenticated(false)
    setUser(null)
    navigate('/')
  }

  // Получаем информацию о текущем пользователе
  const fetchUserInfo = async (tokenToUse) => {
    try {
      console.log('Fetching user info...')
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User info fetched:', userData)
        setUser(userData)
        return userData
      } else {
        console.log('Failed to fetch user info:', response.status)
        return null
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      return null
    }
  }

  // Проверяем валидность токена
  const validateToken = async (tokenToValidate) => {
    try {
      console.log('Validating token with auth service...')
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Token validation response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Token validation successful:', data)
        // Получаем информацию о пользователе при успешной валидации
        await fetchUserInfo(tokenToValidate)
        return true
      } else {
        console.log('Token validation failed:', response.status)
        return false
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  const value = {
    isAuthenticated,
    token,
    loading,
    user,
    login,
    logout,
    validateToken,
    fetchUserInfo
  }

  // Show loading while checking token
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#e0e0e0'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook для использования авторизации
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Функция для получения заголовков с токеном
export function getAuthHeaders(token) {
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  }
}