import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BookMarked, FileText, PenTool, Gamepad2, Users, Radio } from 'lucide-react';
import { ALL_NAV_TABS, DEFAULT_VISIBLE_TABS } from '@/hooks/useNavPreferences';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  BookMarked,
  FileText,
  PenTool,
  Gamepad2,
  Users,
  Radio,
};

interface NavOnboardingModalProps {
  open: boolean;
  onSave: (tabs: string[]) => void;
}

const NavOnboardingModal = ({ open, onSave }: NavOnboardingModalProps) => {
  const [selected, setSelected] = useState<string[]>([...DEFAULT_VISIBLE_TABS]);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    const final = selected.length > 0 ? selected : [...DEFAULT_VISIBLE_TABS];
    onSave(final);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Customize Your Navigation</DialogTitle>
          <DialogDescription>
            Choose which sections you'd like quick access to in the navigation bar. 
            The rest will be available under the "More" menu. You can change this anytime in settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto">
          {ALL_NAV_TABS.map((tab) => {
            const Icon = ICON_MAP[tab.icon] || BookOpen;
            const isChecked = selected.includes(tab.key);

            return (
              <label
                key={tab.key}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isChecked
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-accent/50'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggle(tab.key)}
                />
                <Icon className={`w-5 h-5 shrink-0 ${isChecked ? 'text-brand-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {tab.label}
                    </span>
                    {DEFAULT_VISIBLE_TABS.includes(tab.key) && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tab.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Selected {selected.length} of {ALL_NAV_TABS.length} • Unselected tabs will be in "More" menu
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelected(ALL_NAV_TABS.map((t) => t.key));
            }}
          >
            Select All
          </Button>
          <Button onClick={handleSave} className="bg-gradient-button text-white">
            Save & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NavOnboardingModal;
