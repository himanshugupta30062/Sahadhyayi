
import React, { useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type ProfileAvatarProps = {
  name?: string;
  profile_picture_url?: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  profile_picture_url,
  onAvatarChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative group cursor-pointer">
      <Avatar className="h-24 w-24 ring-2 ring-amber-200 shadow">
        <AvatarImage src={profile_picture_url ?? ""} alt={name ?? "Profile"} />
        <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <Button
        type="button"
        size="sm"
        className="absolute bottom-0 right-0 bg-amber-600 text-white rounded-full p-0 w-9 h-9 flex items-center justify-center border shadow-lg hover:bg-amber-700 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onAvatarChange}
        aria-label="Change Profile Picture"
      />
    </div>
  );
};

export default ProfileAvatar;
