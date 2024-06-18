import { createRoot } from 'react-dom/client'
import './style.css'
import { App } from './Three'


function Root() {
  return (
    <>
      <App />
      <div style={{ position: 'absolute', pointerEvents: 'none', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      </div>{' '}
    </>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
