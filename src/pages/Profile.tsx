
import React from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import SEO from "@/components/SEO";

const ProfilePage: React.FC = () => (
  <>
    <SEO
      title="User Profile - Sahadhyayi"
      description="View and manage your reader profile, update information, and explore your reading activity."
      canonical="https://sahadhyayi.com/profile"
      url="https://sahadhyayi.com/profile" />
    <ProfileView />
  </>
);

export default ProfilePage;
