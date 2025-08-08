export function VoiceButton({ isRecording, onToggle }: { isRecording: boolean; onToggle: () => void }) {
  return (
    <button
      aria-pressed={isRecording}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      onClick={onToggle}
      className={`rounded px-2 py-1 text-sm border ${isRecording ? 'bg-destructive text-destructive-foreground' : ''}`}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? '■' : '🎤'}
    </button>
  );
}
