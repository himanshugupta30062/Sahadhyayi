
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Palette, Save, RotateCcw } from 'lucide-react';
import { useUpdateUserAvatar } from '@/hooks/useUserAvatar';
import { toast } from 'sonner';

interface BitmojiFeatures {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeShape: string;
  eyeColor: string;
  noseShape: string;
  mouthShape: string;
  outfit: string;
  accessory: string;
}

interface BitmojiCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarData: string) => void;
  currentAvatar?: string;
}

export const BitmojiCreator: React.FC<BitmojiCreatorProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatar
}) => {
  const [features, setFeatures] = useState<BitmojiFeatures>({
    skinTone: '#f4d1ae',
    hairStyle: 'short',
    hairColor: '#8b4513',
    eyeShape: 'normal',
    eyeColor: '#654321',
    noseShape: 'normal',
    mouthShape: 'smile',
    outfit: 'casual',
    accessory: 'none'
  });

  const updateAvatarMutation = useUpdateUserAvatar();

  // Predefined options for each feature
  const skinTones = ['#f4d1ae', '#deb887', '#d2691e', '#8b4513', '#654321', '#2f1b14'];
  const hairStyles = ['short', 'long', 'curly', 'bald', 'ponytail', 'buzz'];
  const hairColors = ['#000000', '#8b4513', '#daa520', '#ff6347', '#9370db', '#32cd32'];
  const eyeShapes = ['normal', 'round', 'narrow', 'wide'];
  const eyeColors = ['#654321', '#4169e1', '#228b22', '#808080', '#800080'];
  const outfits = ['casual', 'formal', 'sporty', 'trendy', 'book-lover'];

  const updateFeature = (feature: keyof BitmojiFeatures, value: string) => {
    setFeatures(prev => ({ ...prev, [feature]: value }));
  };

  const generateAvatarSvg = () => {
    return `
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Circle -->
        <circle cx="60" cy="60" r="50" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
        
        <!-- Face -->
        <circle cx="60" cy="55" r="35" fill="${features.skinTone}"/>
        
        <!-- Hair -->
        ${generateHair()}
        
        <!-- Eyes -->
        <ellipse cx="50" cy="50" rx="4" ry="${features.eyeShape === 'round' ? '4' : '3'}" fill="${features.eyeColor}"/>
        <ellipse cx="70" cy="50" rx="4" ry="${features.eyeShape === 'round' ? '4' : '3'}" fill="${features.eyeColor}"/>
        
        <!-- Nose -->
        <ellipse cx="60" cy="58" rx="2" ry="3" fill="${adjustColor(features.skinTone, -10)}"/>
        
        <!-- Mouth -->
        ${generateMouth()}
        
        <!-- Outfit Indicator -->
        <rect x="45" y="85" width="30" height="15" rx="7" fill="${getOutfitColor()}" opacity="0.8"/>
        
        <!-- Book Icon for book-lover outfit -->
        ${features.outfit === 'book-lover' ? '<rect x="55" y="88" width="10" height="8" fill="#8b4513" rx="1"/><line x1="60" y1="88" x2="60" y2="96" stroke="white" stroke-width="0.5"/>' : ''}
      </svg>
    `;
  };

  const generateHair = () => {
    const hairColor = features.hairColor;
    switch (features.hairStyle) {
      case 'short':
        return `<path d="M 35 35 Q 60 20 85 35 Q 85 45 75 50 Q 45 50 35 35" fill="${hairColor}"/>`;
      case 'long':
        return `<path d="M 30 35 Q 60 15 90 35 Q 90 60 85 70 Q 35 70 30 35" fill="${hairColor}"/>`;
      case 'curly':
        return `<circle cx="45" cy="35" r="8" fill="${hairColor}"/><circle cx="60" cy="30" r="10" fill="${hairColor}"/><circle cx="75" cy="35" r="8" fill="${hairColor}"/>`;
      case 'ponytail':
        return `<path d="M 35 35 Q 60 20 85 35 Q 85 45 75 50 Q 45 50 35 35" fill="${hairColor}"/><ellipse cx="85" cy="45" rx="5" ry="15" fill="${hairColor}"/>`;
      case 'buzz':
        return `<path d="M 40 35 Q 60 25 80 35 Q 80 40 70 45 Q 50 45 40 35" fill="${hairColor}" opacity="0.7"/>`;
      default:
        return '';
    }
  };

  const generateMouth = () => {
    switch (features.mouthShape) {
      case 'smile':
        return '<path d="M 50 65 Q 60 70 70 65" stroke="#d2691e" stroke-width="2" fill="none"/>';
      case 'neutral':
        return '<line x1="55" y1="65" x2="65" y2="65" stroke="#d2691e" stroke-width="2"/>';
      case 'surprised':
        return '<ellipse cx="60" cy="65" rx="3" ry="5" fill="#d2691e"/>';
      default:
        return '<path d="M 50 65 Q 60 70 70 65" stroke="#d2691e" stroke-width="2" fill="none"/>';
    }
  };

  const getOutfitColor = () => {
    switch (features.outfit) {
      case 'formal': return '#2c3e50';
      case 'sporty': return '#e74c3c';
      case 'trendy': return '#9b59b6';
      case 'book-lover': return '#8b4513';
      default: return '#3498db';
    }
  };

  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  const handleSave = async () => {
    try {
      const avatarSvg = generateAvatarSvg();
      const avatarDataUrl = 'data:image/svg+xml;base64,' + btoa(avatarSvg);
      
      await updateAvatarMutation.mutateAsync({
        avatar_json: features,
        avatar_img_url: avatarDataUrl,
      });

      onSave(avatarDataUrl);
      toast.success('Avatar saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    }
  };

  const resetToDefault = () => {
    setFeatures({
      skinTone: '#f4d1ae',
      hairStyle: 'short',
      hairColor: '#8b4513',
      eyeShape: 'normal',
      eyeColor: '#654321',
      noseShape: 'normal',
      mouthShape: 'smile',
      outfit: 'casual',
      accessory: 'none'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Create Your Reading Avatar
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-gray-900">Preview</h3>
            <div className="flex justify-center">
              <div 
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-200"
                dangerouslySetInnerHTML={{ __html: generateAvatarSvg() }}
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleSave} 
                className="bg-orange-600 hover:bg-orange-700"
                disabled={updateAvatarMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateAvatarMutation.isPending ? 'Saving...' : 'Save Avatar'}
              </Button>
              <Button onClick={resetToDefault} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Customize</h3>
            
            {/* Skin Tone */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Skin Tone</label>
              <div className="flex gap-2 flex-wrap">
                {skinTones.map((tone, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 ${
                      features.skinTone === tone ? 'border-orange-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: tone }}
                    onClick={() => updateFeature('skinTone', tone)}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Hair Style</label>
              <div className="grid grid-cols-3 gap-2">
                {hairStyles.map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={features.hairStyle === style ? "default" : "outline"}
                    onClick={() => updateFeature('hairStyle', style)}
                    className="text-xs"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Hair Color</label>
              <div className="flex gap-2 flex-wrap">
                {hairColors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-6 h-6 rounded-full border-2 ${
                      features.hairColor === color ? 'border-orange-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateFeature('hairColor', color)}
                  />
                ))}
              </div>
            </div>

            {/* Eye Color */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Eye Color</label>
              <div className="flex gap-2 flex-wrap">
                {eyeColors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-6 h-6 rounded-full border-2 ${
                      features.eyeColor === color ? 'border-orange-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateFeature('eyeColor', color)}
                  />
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Outfit Style</label>
              <div className="grid grid-cols-2 gap-2">
                {outfits.map((outfit) => (
                  <Button
                    key={outfit}
                    size="sm"
                    variant={features.outfit === outfit ? "default" : "outline"}
                    onClick={() => updateFeature('outfit', outfit)}
                    className="text-xs"
                  >
                    {outfit.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
