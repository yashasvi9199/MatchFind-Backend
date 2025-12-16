export interface FamilyMember {
  title: string;
  name: string;
  gotra: string;
  caste: string;
  occupation: string;
}

export interface ProfileData {
  title: string;
  name: string;
  gender: 'Male' | 'Female';
  age: number;
  height: string;
  weight: string;
  skinColor: string;
  bloodGroup: string;
  diet: 'Vegetarian' | 'Jain' | 'Non-Vegetarian' | 'Vegan';
  bio: string;
  caste: string;
  gotra: string;
  birthPlace: string;
  birthTime: string; 
  nativeCountry: string;
  nativeState: string;
  nativeCity: string;
  currentCountry: string;
  currentState: string;
  currentCity: string;
  educationLevel: string;
  educationStream: string;
  educationDegree: string;
  education: string;
  occupation: string;
  salary: string;
  father: FamilyMember;
  mother: FamilyMember;
  paternalSide: FamilyMember;
  siblings: FamilyMember[];
  healthIssues: string[];
  partnerAgeMin: string;
  partnerAgeMax: string;
  expectations: string[];
}

export interface UserProfile extends ProfileData {
  id: string;
  email?: string; 
  phone?: string; 
  password?: string;
  avatar_url?: string;
  updated_at?: string;
  is_demo?: boolean; 
}
