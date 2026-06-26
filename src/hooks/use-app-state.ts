import { useState, useEffect } from 'react'
import { Problem, Board, AppSettings } from '../lib/types'
import { api } from '../lib/api-client'
import { DEFAULT_BOARD } from '../lib/constants'
import { initDb } from '../lib/db'
import { getSettings } from '../lib/settings'
import { toast } from 'sonner'

interface LocalUser {
  id: string
  username: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Failed to save'
  }
}

export function useAppState() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string>(DEFAULT_BOARD.id)
  
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [settings, setSettings] = useState<AppSettings | null>(null)

  const refreshSettings = async () => {
    try {
      const settingsData = await getSettings()
      setSettings(settingsData)
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await initDb()
        const authData = await api.auth.me()
        setUser(authData.user ?? { id: 'local', username: 'Local User' })
        const [boardsData, problemsData, settingsData] = await Promise.all([
          api.boards.list(),
          api.problems.list(),
          getSettings()
        ])
        setSettings(settingsData)
        
        const availableBoards = boardsData.length > 0 ? boardsData : [DEFAULT_BOARD]

        if (availableBoards.length > 0) {
          setBoards(availableBoards)
          const savedActiveBoard = localStorage.getItem('brickcp.activeBoard')
          if (savedActiveBoard && availableBoards.find((b: Board) => b.id === savedActiveBoard)) {
            setActiveBoardId(savedActiveBoard)
          } else {
            setActiveBoardId(availableBoards[0].id)
          }
        }
        setProblems(problemsData)
      } catch (e) {
        console.error('Failed to init app state', e)
      } finally {
        setTimeout(() => setLoaded(true), 300)
      }
    }
    
    init()
  }, [])

  const handleCreateBoard = async (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBoard = await api.boards.create(board)
      setBoards(prev => [...prev, newBoard])
      setActiveBoardId(newBoard.id)
      localStorage.setItem('brickcp.activeBoard', newBoard.id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditBoard = async (id: string, updates: Partial<Board>) => {
    try {
      const updated = await api.boards.update(id, updates)
      setBoards(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b))
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteBoard = async (id: string) => {
    try {
      const remainingBoards = boards.filter(b => b.id !== id)
      await api.boards.delete(id)
      setBoards(remainingBoards)
      setProblems(prev => prev.filter(p => p.boardId !== id))
      if (activeBoardId === id) {
        const nextBoard = remainingBoards[0]
        if (nextBoard) {
          setActiveBoardId(nextBoard.id)
          localStorage.setItem('brickcp.activeBoard', nextBoard.id)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const updateProblem = async (id: string, updates: Partial<Problem>) => {
    setSaveState('saving')
    try {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      await api.problems.update(id, updates)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch (e) {
      setSaveState('error')
      setSaveMessage(getErrorMessage(e))
      console.error(e)
      throw e
    }
  }

  const handleDeleteProblem = async (id: string) => {
    try {
      setProblems(prev => prev.filter(p => p.id !== id))
      await api.problems.delete(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleClearProblemsByStatus = async (status: string) => {
    try {
      setProblems(prev => prev.filter(p => !(p.boardId === activeBoardId && p.status === status)))
      await api.problems.clear(activeBoardId, status)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSyncProblem = async (id: string) => {
    setProblems(prev => prev.map(p => p.id === id ? { ...p, githubSyncStatus: 'syncing' } : p))
    try {
      const updated = await api.problems.sync(id)
      setProblems(prev => prev.map(p => p.id === id ? updated : p))
      toast.success("Solution synced to GitHub successfully!")
    } catch (e) {
      const err = e as Error
      toast.error(err.message || "Failed to sync solution")
      setProblems(prev => prev.map(p => p.id === id ? { ...p, githubSyncStatus: 'failed' } : p))
    }
  }

  const replaceProblems = async (newProblems: Problem[]) => {
    const nextIds = new Set(newProblems.map((problem) => problem.id))
    const removedProblems = problems.filter((problem) => !nextIds.has(problem.id))

    setProblems(newProblems)
    await Promise.all(removedProblems.map((problem) => api.problems.delete(problem.id)))
    await Promise.all(newProblems.map(async (problem) => {
      try {
        await api.problems.update(problem.id, problem)
      } catch (error) {
        if (error instanceof Error && error.message === 'Problem not found') {
          await api.problems.create(problem)
          return
        }
        throw error
      }
    }))
  }

  const handleResetData = async () => {
    await Promise.all(problems.map((problem) => api.problems.delete(problem.id)))
    const freshProblems = await api.problems.list()
    setProblems(freshProblems)
  }
  
  const loginWithGithub = () => {
    setUser({ id: 'local', username: 'Local User' })
  }

  return {
    user,
    loaded,
    corruptData: false,
    problems,
    setProblems,
    replaceProblems,
    updateProblem,
    moveProblem: updateProblem,
    handleDeleteProblem,
    handleClearProblemsByStatus,
    
    boards,
    activeBoardId,
    setActiveBoardId: (id: string) => {
      setActiveBoardId(id)
      localStorage.setItem('brickcp.activeBoard', id)
    },
    handleCreateBoard,
    handleEditBoard,
    handleDeleteBoard,
    
    saveState,
    saveMessage,
    handleSettingsSaved: () => {},
    handleResetData,
    loginWithGithub,
    
    settings,
    refreshSettings,
    handleSyncProblem
  }
}
