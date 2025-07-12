
import * as React from "react"
import { Search, X, Mic, MicOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useSpeechToText } from "@/hooks/useSpeechToText"

export interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string
  onValueChange: (value: string) => void
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value, onValueChange, ...props }, ref) => {
    const { isRecording, toggleRecording } = useSpeechToText({
      onTranscript: (text) => onValueChange(text),
      onError: (error) => console.error('Speech recognition error:', error)
    })

    return (
      <div className={cn("relative w-full", className)}>
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        {value && (
          <button
            type="button"
            onClick={() => onValueChange("")}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleRecording}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn("pl-10 pr-16", className)}
          {...props}
        />
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }
