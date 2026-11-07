import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Internacional } from './internacional'
import { CookieNotice } from './cookie-notice'
import './fonts.css'
import './index.css'

// /en e /es: versão em inglês e espanhol; o resto é o site em português
const idioma = { '/en': 'en', '/es': 'es' }[window.location.pathname.replace(/\/$/, '')]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {idioma ? <Internacional idioma={idioma} /> : <App />}
    <CookieNotice idioma={idioma} />
  </React.StrictMode>,
)
