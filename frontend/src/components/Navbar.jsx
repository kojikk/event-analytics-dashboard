import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'

function Navbar() {
  const location = useLocation()
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="header">
      <nav className="nav">
        <h1 style={{ margin: 0, marginRight: '2rem' }}>Event Analytics</h1>
        
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
        >
          Dashboard
        </Link>
        
        {isAuthenticated && (
          <Link 
            to="/admin" 
            className={location.pathname === '/admin' ? 'active' : ''}
          >
            Admin Panel
          </Link>
        )}
        
        <div style={{ marginLeft: 'auto' }}>
          {isAuthenticated ? (
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar