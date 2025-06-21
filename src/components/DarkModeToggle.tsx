import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';

type Props = {
  className?: string;
  showLabel?: boolean;
};

const DarkModeToggle = ({ className, showLabel = false }: Props) => {
  const { isDark, toggle } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size={showLabel ? undefined : 'icon'}
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={`text-gray-700 hover:bg-amber-50 dark:text-gray-200 dark:hover:bg-amber-900 ${className ?? ''}`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {showLabel && <span className="ml-2">{isDark ? 'Light' : 'Dark'} Mode</span>}
    </Button>
  );
};

export default DarkModeToggle;
