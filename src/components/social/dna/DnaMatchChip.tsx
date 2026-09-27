import React, { useState } from "react";
import { useDnaMatch } from "@/hooks/useReadingDna";
import { Badge } from "@/components/ui/badge";
import { DnaCompare } from "./DnaCompare";
import { Dna, Loader2 } from "lucide-react";

interface DnaMatchChipProps {
  userId: string;
  userName?: string;
  className?: string;
}

export const DnaMatchChip: React.FC<DnaMatchChipProps> = ({
  userId,
  userName = "Reader",
  className = "",
}) => {
  const [compareOpen, setCompareOpen] = useState(false);
  const { score, myDna, targetDna, isLoading } = useDnaMatch(userId);

  if (isLoading || score === null || !myDna || !targetDna) {
    return null;
  }

  // Calculate vibrant color based on score
  const hue = Math.min(130, Math.max(0, score * 1.3)); // from red/orange to green

  return (
    <>
      <Badge
        onClick={(e) => {
          e.stopPropagation();
          setCompareOpen(true);
        }}
        style={{
          backgroundColor: `hsl(${hue} 75% 95%)`,
          borderColor: `hsl(${hue} 75% 65%)`,
          color: `hsl(${hue} 85% 25%)`,
        }}
        className={`cursor-pointer hover:scale-105 active:scale-95 transition-all text-[10px] px-2 py-0.5 gap-1 border font-medium ${className}`}
        title={`Click to compare reading DNA with ${userName}`}
      >
        <Dna className="w-2.5 h-2.5 shrink-0" />
        <span>{score}% match</span>
      </Badge>

      <DnaCompare
        friendDna={targetDna}
        myDna={myDna}
        friendName={userName}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
    </>
  );
};
export default DnaMatchChip;
