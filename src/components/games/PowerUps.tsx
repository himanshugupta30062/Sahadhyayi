import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Shield,
  Timer,
  Eye,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  cost: number;
  quantity: number;
}

const defaultPowerUps: PowerUp[] = [
  {
    id: 'double_points',
    name: '2X Points',
    description: 'Double points for next question',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-yellow-500 to-amber-600',
    cost: 200,
    quantity: 2,
  },
  {
    id: 'extra_time',
    name: '+15 Seconds',
    description: 'Add 15 seconds to timer',
    icon: <Timer className="h-5 w-5" />,
    color: 'from-blue-500 to-cyan-600',
    cost: 100,
    quantity: 3,
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Protect against wrong answer',
    icon: <Shield className="h-5 w-5" />,
    color: 'from-green-500 to-emerald-600',
    cost: 500,
    quantity: 1,
  },
  {
    id: 'reveal',
    name: 'Reveal',
    description: 'Show the correct answer briefly',
    icon: <Eye className="h-5 w-5" />,
    color: 'from-purple-500 to-violet-600',
    cost: 300,
    quantity: 1,
  },
];

interface PowerUpsProps {
  powerUps?: PowerUp[];
  onUsePowerUp: (powerUpId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function PowerUps({ 
  powerUps = defaultPowerUps, 
  onUsePowerUp, 
  disabled = false,
  compact = false 
}: PowerUpsProps) {
  if (compact) {
    return (
      <div className="flex gap-2">
        {powerUps.filter(p => p.quantity > 0).map((powerUp) => (
          <motion.button
            key={powerUp.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={disabled || powerUp.quantity === 0}
            onClick={() => onUsePowerUp(powerUp.id)}
            className={cn(
              'relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-all',
              `bg-gradient-to-br ${powerUp.color}`,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {powerUp.icon}
            {powerUp.quantity > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-foreground text-xs font-bold rounded-full flex items-center justify-center shadow">
                {powerUp.quantity}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Power-Ups</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {powerUps.map((powerUp, index) => (
          <motion.div
            key={powerUp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              disabled={disabled || powerUp.quantity === 0}
              onClick={() => onUsePowerUp(powerUp.id)}
              className={cn(
                'w-full h-auto p-3 flex flex-col items-start gap-2 relative overflow-hidden group',
                powerUp.quantity === 0 && 'opacity-50'
              )}
            >
              {/* Gradient background on hover */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br',
                powerUp.color
              )} />
              
              <div className="flex items-center justify-between w-full">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br',
                  powerUp.color
                )}>
                  {powerUp.icon}
                </div>
                <Badge variant="secondary">
                  x{powerUp.quantity}
                </Badge>
              </div>
              
              <div className="text-left">
                <p className="font-medium text-sm">{powerUp.name}</p>
                <p className="text-xs text-muted-foreground">{powerUp.description}</p>
              </div>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Power-up effect component for in-game display
export function PowerUpEffect({ type, onComplete }: { type: string; onComplete: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const effects: Record<string, { icon: React.ReactNode; text: string; color: string }> = {
    double_points: { icon: <Zap className="h-12 w-12" />, text: '2X POINTS!', color: 'text-yellow-400' },
    extra_time: { icon: <Timer className="h-12 w-12" />, text: '+15 SECONDS!', color: 'text-blue-400' },
    shield: { icon: <Shield className="h-12 w-12" />, text: 'SHIELD ACTIVE!', color: 'text-green-400' },
    reveal: { icon: <Eye className="h-12 w-12" />, text: 'REVEALING...', color: 'text-purple-400' },
  };

  const effect = effects[type];
  if (!effect) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          className={effect.color}
        >
          {effect.icon}
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-3xl font-black mt-4 ${effect.color}`}
        >
          {effect.text}
        </motion.p>
      </div>
    </motion.div>
  );
}
