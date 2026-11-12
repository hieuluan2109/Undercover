import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { normalizeRoomCode } from './online/protocol.js'
import { ClientApp } from './screens/ClientApp.jsx'

// Link ?room=MÃ (từ mã QR của host) mở app của người chơi thay vì app chính.
const room = normalizeRoomCode(new URLSearchParams(location.search).get('room') ?? '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {room ? <ClientApp room={room} /> : <App />}
  </StrictMode>,
)
