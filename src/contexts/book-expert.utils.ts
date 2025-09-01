import { createContext, useContext } from 'react'

export interface ChatMessage {
  sender: 'user' | 'bot'
  text: string
}

export interface BookExpertContextType {
  isOpen: boolean
  messages: ChatMessage[]
  toggleChat: () => void
  closeChat: () => void
  sendMessage: (text: string) => Promise<void>
}

export const BookExpertContext = createContext<BookExpertContextType | undefined>(undefined)

export const useBookExpert = () => {
  const ctx = useContext(BookExpertContext)
  if (!ctx) {
    throw new Error('useBookExpert must be used within BookExpertProvider')
  }
  return ctx
}
