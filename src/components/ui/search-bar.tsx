
import React from "react"
import { Search, Mic, MicOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useSpeechToText } from "@/hooks/useSpeechToText"

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string
  onValueChange: (value: string) => void
  onSearch?: () => void
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onValueChange, onSearch, ...props }, ref) => {
    const { isRecording, toggleRecording } = useSpeechToText({
      onTranscript: (text) => onValueChange(text),
      onError: (error) => console.error('Speech recognition error:', error)
    })

    // Trigger search when user presses Enter
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onSearch?.()
        }
      },
      [onSearch]
    )

    return (
      <div className={cn('relative w-full', className)}>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-4 pr-16 h-12 text-base rounded-xl shadow-sm"
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleRecording}
            aria-label="Voice search"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        </div>
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
