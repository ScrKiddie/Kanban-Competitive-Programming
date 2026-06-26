import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { KanbanCpApp } from './components/app/kanbancp-app'
import { ThemeProvider } from './components/providers/theme-provider'
import { Toaster } from './components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <KanbanCpApp />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
