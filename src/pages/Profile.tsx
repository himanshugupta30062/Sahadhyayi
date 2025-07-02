
import React from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import SEO from "@/components/SEO";

const ProfilePage: React.FC = () => (
  <>
    <SEO
      title="User Profile - Sahadhyayi"
      description="View and manage your reader profile, update information, and explore your reading activity." />
    <ProfileView />
  </>
);

export default ProfilePage;
