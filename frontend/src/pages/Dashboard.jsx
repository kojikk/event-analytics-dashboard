import { useState, useEffect } from 'react'
import { analytics } from '../utils/analytics'

function Dashboard() {
  const [interactions, setInteractions] = useState(0)
  const [lastAction, setLastAction] = useState('')
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Обновляем время каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = (actionType, actionData = {}) => {
    setInteractions(prev => prev + 1)
    setLastAction(`${actionType}: ${JSON.stringify(actionData)}`)
    
    analytics.trackEvent(actionType, {
      ...actionData,
      timestamp: new Date().toISOString(),
      session_interactions: interactions + 1
    })
  }

  const handleMessageSubmit = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return
    
    const newMessage = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date().toISOString(),
      type: 'user'
    }
    
    setMessages(prev => [...prev, newMessage])
    handleAction('message_sent', { message_length: messageText.length })
    setMessageText('')
    
    // Симуляция автоответа
    setTimeout(() => {
      const autoReply = {
        id: Date.now() + 1,
        text: `Получено сообщение: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
        timestamp: new Date().toISOString(),
        type: 'system'
      }
      setMessages(prev => [...prev, autoReply])
    }, 1000)
  }

  return (
    <div className="floating-elements">
      <div className="container">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Interactive Analytics Dashboard</h1>
          <p className="hero-subtitle">
            Explore our demo platform with real-time event tracking.
            <br />Every interaction is captured and analyzed for insights.
          </p>
        </div>

        {/* Live Status */}
        {lastAction && (
          <div className="message-display success">
            <strong>🎯 Last Action:</strong> {lastAction}
            <br />
            <strong>📊 Total Interactions:</strong> {interactions}
            <br />
            <strong>⏰ Time:</strong> {currentTime.toLocaleTimeString()}
          </div>
        )}

        {/* Interactive Actions */}
        <div className="card">
          <h3>🚀 Quick Actions</h3>
          <div className="action-grid">
            <div 
              className="action-item"
              onClick={() => handleAction('button_click', { button_type: 'primary', action: 'launch' })}
            >
              <div className="action-icon">🚀</div>
              <h4>Launch</h4>
              <p>Start new project</p>
            </div>
            
            <div 
              className="action-item"
              onClick={() => handleAction('button_click', { button_type: 'secondary', action: 'analyze' })}
            >
              <div className="action-icon">📊</div>
              <h4>Analyze</h4>
              <p>View data insights</p>
            </div>
            
            <div 
              className="action-item"
              onClick={() => handleAction('button_click', { button_type: 'info', action: 'explore' })}
            >
              <div className="action-icon">🔍</div>
              <h4>Explore</h4>
              <p>Discover features</p>
            </div>
            
            <div 
              className="action-item"
              onClick={() => handleAction('button_click', { button_type: 'danger', action: 'alert' })}
            >
              <div className="action-icon">⚡</div>
              <h4>Alert</h4>
              <p>Emergency action</p>
            </div>
          </div>
        </div>

        {/* Message System */}
        <div className="card">
          <h3>💬 Message Center</h3>
          <form onSubmit={handleMessageSubmit}>
            <div className="form-group">
              <textarea
                placeholder="Enter your message here... This is just a demo - messages go nowhere!"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows="4"
              />
            </div>
            <button type="submit" className="btn">
              Send Message
            </button>
          </form>
          
          {messages.length > 0 && (
            <div className="scrollable-content" style={{ marginTop: '1rem' }}>
              <h4>Message History:</h4>
              {messages.map(message => (
                <div 
                  key={message.id}
                  className={`message-display ${message.type === 'system' ? '' : 'success'}`}
                  style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}
                >
                  <strong>{message.type === 'user' ? '👤 You' : '🤖 System'}:</strong> {message.text}
                  <br />
                  <small style={{ color: 'rgba(224, 224, 224, 0.6)' }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Showcase */}
        <div className="card">
          <h3>🎨 Feature Showcase</h3>
          <div className="grid">
            {[
              { icon: '📈', name: 'Analytics', desc: 'Real-time data visualization' },
              { icon: '🔐', name: 'Security', desc: 'Advanced protection systems' },
              { icon: '⚙️', name: 'Settings', desc: 'Customizable preferences' },
              { icon: '📱', name: 'Mobile', desc: 'Responsive design' },
              { icon: '🌐', name: 'Global', desc: 'Worldwide accessibility' },
              { icon: '🤖', name: 'AI', desc: 'Machine learning integration' }
            ].map(feature => (
              <div 
                key={feature.name}
                className="card"
                onClick={() => handleAction('feature_usage', { feature_name: feature.name })}
                style={{ cursor: 'pointer', textAlign: 'center', padding: '1.5rem' }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h4>{feature.name}</h4>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content Demo */}
        <div className="card">
          <h3>📜 Scrollable Content</h3>
          <div className="scrollable-content">
            {Array.from({ length: 20 }, (_, i) => (
              <div 
                key={i}
                className="action-item"
                onClick={() => handleAction('content_scroll', { item_index: i })}
                style={{ margin: '0.5rem 0' }}
              >
                <strong>Item #{i + 1}</strong>
                <p>This is scrollable content item {i + 1}. Click to track interaction!</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Statistics */}
        <div className="card">
          <h3>📊 Live Dashboard Stats</h3>
          <div className="grid">
            <div className="stats-item">
              <div className="stats-number">{interactions}</div>
              <div className="stats-label">Total Interactions</div>
            </div>
            <div className="stats-item">
              <div className="stats-number">{messages.length}</div>
              <div className="stats-label">Messages Sent</div>
            </div>
            <div className="stats-item">
              <div className="stats-number">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="stats-label">Current Time</div>
            </div>
            <div className="stats-item">
              <div className="stats-number">
                {Math.floor((Date.now() - performance.timing.navigationStart) / 1000)}
              </div>
              <div className="stats-label">Session Duration (s)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard