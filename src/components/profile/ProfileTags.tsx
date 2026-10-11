import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

type ProfileTagsProps = {
  life_tags?: string[];
};

const ProfileTags: React.FC<ProfileTagsProps> = ({ life_tags }) => (
  <div className="mt-4 w-full">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-medium text-muted-foreground">Interests & Life Phases</span>
      <Link to="/articles/my">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.1)] px-2"
        >
          <BookOpen className="w-3 h-3 mr-1" />
          My Published Articles
        </Button>
      </Link>
    </div>
    <div className="flex gap-1.5 flex-wrap">
      {life_tags && life_tags.length ? (
        life_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="cursor-default text-xs">
            {tag}
          </Badge>
        ))
      ) : (
        <span className="italic text-xs text-muted-foreground">No tags added yet</span>
      )}
    </div>
  </div>
);

export default ProfileTags;
