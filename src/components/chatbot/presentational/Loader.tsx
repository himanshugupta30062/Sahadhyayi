import BookFlipLoader from '@/components/ui/BookFlipLoader';

export function Loader({ label = 'Thinking…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <BookFlipLoader size="sm" showText={true} text={label} />
    </div>
  );
}
