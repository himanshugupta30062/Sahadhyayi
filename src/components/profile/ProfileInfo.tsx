import React from "react";
import ProfileStats from "./ProfileStats";

type ProfileInfoProps = {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  gender?: string;
  writingFrequency: string;
  joined_at?: string;
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  name,
  username,
  email,
  bio,
  gender,
  writingFrequency,
  joined_at
}) => (
  <div className="w-full flex flex-col items-center text-center">
    <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
      {name || "Unnamed"}
      {username && (
        <span className="text-[hsl(var(--brand-primary))] font-mono text-base font-normal">
          @{username}
        </span>
      )}
    </h2>
    <div className="flex justify-center items-center gap-2 mt-1 mb-2 text-muted-foreground text-sm">
      <span>{email || "No email"}</span>
    </div>
    <p className={`text-sm max-w-md mb-3 leading-relaxed ${bio ? "text-muted-foreground" : "text-muted-foreground/75 italic"}`}>
      {bio || "Add a short introduction about yourself and the books you love."}
    </p>
    <ProfileStats writingFrequency={writingFrequency} gender={gender} joined_at={joined_at} />
  </div>
);

export default ProfileInfo;
