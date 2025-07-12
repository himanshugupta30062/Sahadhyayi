
import * as React from "react"
import { Search, Send, X, Mic, MicOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useSpeechToText } from "@/hooks/useSpeechToText"

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string
  onValueChange: (value: string) => void
  onSearch?: (value: string) => void
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onValueChange, onSearch, ...props }, ref) => {
    const { isRecording, toggleRecording } = useSpeechToText({
      onTranscript: (text) => onValueChange(text),
      onError: (error) => console.error('Speech recognition error:', error)
    })

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        e.preventDefault()
        onSearch(value)
      }
    }

    return (
      <div className={cn('relative w-full', className)}>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn('pl-9 pr-20', className)}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => onValueChange('')}
              aria-label="Clear search"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          {onSearch && (
            <button
              type="button"
              onClick={() => onSearch(value)}
              aria-label="Search"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
