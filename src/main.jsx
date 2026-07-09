import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyTheme } from './store/theme.js'
import './index.css'

// Apply the saved theme (dark by default) before the first paint so there's no
// flash of the wrong theme while React mounts.
applyTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
