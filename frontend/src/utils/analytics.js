// Конфигурация API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Генерируем уникальный ID сессии пользователя
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Получаем или создаем ID сессии
const getSessionId = () => {
  let sessionId = localStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Получаем ID пользователя (пока заглушка)
const getUserId = () => {
  let userId = localStorage.getItem('analytics_user_id')
  if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('analytics_user_id', userId)
  }
  return userId
}

// Основная функция для отправки событий
export const trackEvent = async (eventType, eventData = {}) => {
  try {
    const payload = {
      event_type: eventType,
      user_id: getUserId(),
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      ...eventData
    }

    // Отправляем в API Gateway
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    // API должен вернуть 202 Accepted
    if (response.status === 202) {
      console.log('Event tracked successfully:', eventType)
    } else {
      console.warn('Event tracking failed:', response.status)
    }
  } catch (error) {
    console.error('Error tracking event:', error)
    // В production можно добавить fallback в localStorage для offline режима
  }
}

// Специальные функции для часто используемых событий
export const trackPageView = (page) => {
  trackEvent('page_view', {
    page,
    referrer: document.referrer
  })
}

export const trackClick = (elementType, elementId = null) => {
  trackEvent('click', {
    element_type: elementType,
    element_id: elementId
  })
}

export const trackFormSubmit = (formName, success = true) => {
  trackEvent('form_submit', {
    form_name: formName,
    success
  })
}

export const trackError = (errorType, errorMessage) => {
  trackEvent('error', {
    error_type: errorType,
    error_message: errorMessage
  })
}

// Автоматическое отслеживание страниц (можно вызвать в useEffect)
export const initPageTracking = () => {
  // Отслеживаем начальную загрузку
  trackPageView(window.location.pathname)
  
  // Отслеживаем изменения URL (для SPA)
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args)
    trackPageView(window.location.pathname)
  }
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args)
    trackPageView(window.location.pathname)
  }
  
  // Отслеживаем кнопки "назад/вперед"
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname)
  })
}

// Функции для админ панели - получение аналитики
export const fetchAnalytics = async (endpoint, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE_URL}/analytics/${endpoint}`, {
      headers
    })
    
    if (response.ok) {
      return await response.json()
    } else {
      throw new Error(`API Error: ${response.status}`)
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    throw error
  }
}

// Получение различных типов аналитики
export const getEventCounts = (token) => fetchAnalytics('events/count', token)
export const getEventsByType = (token) => fetchAnalytics('events/by-type', token)
export const getEventsByUser = (token) => fetchAnalytics('events/by-user', token)
export const getTimeseries = (token) => fetchAnalytics('events/timeseries', token)

// Класс для удобного API
class AnalyticsTracker {
  constructor() {
    this.sessionId = getSessionId()
    this.userId = getUserId()
  }

  async trackEvent(eventType, additionalData = {}) {
    return trackEvent(eventType, additionalData)
  }

  trackPageView(page) {
    return trackPageView(page || window.location.pathname)
  }

  trackButtonClick(buttonName, section) {
    return trackEvent('button_click', {
      button_name: buttonName,
      section: section || 'unknown'
    })
  }

  trackFeatureUsage(featureName, details = {}) {
    return trackEvent('feature_usage', {
      feature_name: featureName,
      ...details
    })
  }

  trackMessageSent(messageLength) {
    return trackEvent('message_sent', {
      message_length: messageLength,
      section: 'message_center'
    })
  }

  trackLogin(success, username) {
    return trackEvent('login_attempt', {
      success,
      username: success ? username : undefined
    })
  }

  trackRegistration(success, username) {
    return trackEvent('registration_attempt', {
      success,
      username: success ? username : undefined
    })
  }
}

// Экспортируем глобальный экземпляр
export const analytics = new AnalyticsTracker()

// Автоматически отслеживаем загрузку страницы
if (typeof window !== 'undefined') {
  analytics.trackPageView()
}
