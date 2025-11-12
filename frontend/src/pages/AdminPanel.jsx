import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// Fake data for demo purposes
const generateFakeData = () => ({
  timeseries: [
    { time: '00:00', events: 12 },
    { time: '04:00', events: 8 },
    { time: '08:00', events: 45 },
    { time: '12:00', events: 78 },
    { time: '16:00', events: 65 },
    { time: '20:00', events: 34 },
    { time: '24:00', events: 23 }
  ],
  eventTypes: [
    { type: 'button_click', count: 156 },
    { type: 'feature_usage', count: 89 },
    { type: 'product_view', count: 234 },
    { type: 'page_view', count: 445 }
  ],
  topUsers: [
    { user: 'user_001', events: 89 },
    { user: 'user_045', events: 67 },
    { user: 'user_123', events: 54 },
    { user: 'user_089', events: 43 },
    { user: 'user_156', events: 32 }
  ]
})

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

function AdminPanel() {
  const [data, setData] = useState(generateFakeData())
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Симулируем загрузку данных
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // В будущем здесь будет реальный API call
    }, 30000) // Обновляем каждые 30 секунд

    return () => clearInterval(interval)
  }, [])

  const refreshData = () => {
    setLoading(true)
    setTimeout(() => {
      setData(generateFakeData())
      setLastUpdate(new Date())
      setLoading(false)
    }, 1000)
  }

  const totalEvents = data.eventTypes.reduce((sum, item) => sum + item.count, 0)
  const avgEventsPerHour = Math.round(totalEvents / 24)

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Analytics Admin Panel</h2>
        <button onClick={refreshData} className="btn" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <p>Last updated: {lastUpdate.toLocaleString()}</p>

      {/* Key Metrics */}
      <div className="grid">
        <div className="card stats-item">
          <div className="stats-number">{totalEvents}</div>
          <div className="stats-label">Total Events Today</div>
        </div>
        <div className="card stats-item">
          <div className="stats-number">{avgEventsPerHour}</div>
          <div className="stats-label">Events per Hour</div>
        </div>
        <div className="card stats-item">
          <div className="stats-number">{data.eventTypes.length}</div>
          <div className="stats-label">Event Types</div>
        </div>
        <div className="card stats-item">
          <div className="stats-number">{data.topUsers.length}</div>
          <div className="stats-label">Active Users</div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="card">
        <h3>Events Timeline (24h)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timeseries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="events" stroke="#3498db" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Event Types Distribution */}
        <div className="card">
          <h3>Events by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.eventTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Event Types Pie Chart */}
        <div className="card">
          <h3>Event Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.eventTypes}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.eventTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users */}
      <div className="card">
        <h3>Most Active Users</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>User ID</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Events Count</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.map((user, index) => (
                <tr key={user.user} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{user.user}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{user.events}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {((user.events / totalEvents) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Data Export */}
      <div className="card">
        <h3>Data Export</h3>
        <p>Export analytics data in various formats</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn">Export CSV</button>
          <button className="btn btn-secondary">Export JSON</button>
          <button className="btn btn-secondary">Export PDF Report</button>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel