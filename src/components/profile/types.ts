export interface ProfileFormValues {
  name: string;
  username: string;
  bio: string;
  dob: string;
  gender: string;
  location: string;
  life_tags: string[];
  social_links: Record<string, string>;
}

