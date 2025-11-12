import { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()

  // Проверяем токен при загрузке
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setIsAuthenticated(true)
    navigate('/admin')
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setIsAuthenticated(false)
    navigate('/')
  }

  // Проверяем валидность токена (в реальном приложении - запрос к API)
  const validateToken = async (tokenToValidate) => {
    try {
      // Заглушка - в реальности здесь будет запрос к API Gateway
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`
        }
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
    validateToken
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