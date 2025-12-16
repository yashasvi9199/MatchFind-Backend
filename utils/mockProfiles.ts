import { UserProfile, FamilyMember } from '../types';

// Helper to generate UUID
const uuid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

// --- Data Pools ---
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Jaipur', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Indore', 'Lucknow'];
const STATES: Record<string, string> = {
  'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Delhi': 'Delhi', 'Bangalore': 'Karnataka',
  'Jaipur': 'Rajasthan', 'Hyderabad': 'Telangana', 'Chennai': 'Tamil Nadu', 'Ahmedabad': 'Gujarat',
  'Indore': 'Madhya Pradesh', 'Lucknow': 'Uttar Pradesh'
};
const CASTES_POOL = ['Agarwal', 'Jain', 'Brahmin', 'Kayastha', 'Maratha', 'Khandelwal', 'Gupta', 'Sharma'];
const GOTRAS_POOL = ['Garg', 'Bansal', 'Goyal', 'Mittal', 'Kashyap', 'Bhardwaj', 'Vashishtha', 'Sandilya'];
const OCCUPATIONS = ['Software Engineer', 'Doctor', 'Chartered Accountant', 'Architect', 'Business Owner', 'Civil Servant', 'Professor', 'Marketing Manager', 'Product Designer', 'Investment Banker'];
const SALARIES = ['5-7 LPA', '7-10 LPA', '10-15 LPA', '15-20 LPA', '20-25 LPA', '25-30 LPA', '30+ LPA'];
const EDUCATIONS = [
  { level: 'Graduate', degree: 'B.Tech', stream: 'Engineering' },
  { level: 'Post Graduate', degree: 'MBA', stream: 'Management' },
  { level: 'Doctorate', degree: 'MD', stream: 'Medical' },
  { level: 'Professional', degree: 'CA', stream: 'Finance' },
  { level: 'Graduate', degree: 'B.Arch', stream: 'Architecture' }
];

const BIOS = [
  "I am a simple person with family values. Looking for someone who is understanding and caring.",
  "Ambitious professional who loves traveling and trying new cuisines. Seeking a partner with a modern outlook.",
  "Family-oriented and spiritually inclined. I enjoy reading and classical music.",
  "Tech enthusiast and foodie. Looking for a friend and partner to share life's journey with.",
  "Creative soul, love painting and arts. Seeking someone who appreciates creativity and simplicity.",
  "Fitness freak and disciplined. Looking for a partner who values health and family.",
  "Easy-going and fun-loving. I believe in mutual respect and growing together in a relationship."
];

// --- Generators ---
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateFamilyMember = (rel: 'Father' | 'Mother' | 'Grandfather', surname: string): FamilyMember => ({
  title: rel === 'Mother' ? 'Mrs' : 'Mr',
  name: rel === 'Mother' ? `Sunita ${surname}` : (rel === 'Father' ? `Rajesh ${surname}` : `Ram ${surname}`),
  caste: 'Same',
  gotra: 'Same',
  occupation: rel === 'Mother' ? getRandom(['Homemaker', 'Teacher', 'Doctor']) : getRandom(['Businessman', 'Retired', 'Service'])
});

const generateProfile = (gender: 'Male' | 'Female', i: number, isTestUser = false): UserProfile => {
  const isMale = gender === 'Male';
  const firstName = isMale 
    ? ["Aarav", "Vihaan", "Aditya", "Kabir", "Arjun", "Reyansh", "Vivaan", "Rohan", "Aryan", "Ishaan"][i]
    : ["Aadya", "Diya", "Saanvi", "Ananya", "Kiara", "Myra", "Amaira", "Riya", "Hazel", "Sia"][i];
  
  const surname = isMale 
    ? ["Sharma", "Verma", "Gupta", "Malhotra", "Mehta", "Joshi", "Kapoor", "Singhania", "Reddy", "Nair"][i]
    : ["Agarwal", "Jain", "Saxena", "Iyer", "Kulkarni", "Deshmukh", "Chopra", "Seth", "Tiwari", "Das"][i];

  const city = getRandom(CITIES);
  const edu = getRandom(EDUCATIONS);
  const caste = getRandom(CASTES_POOL);

  // Hardcode specific details for test users
  const email = isTestUser ? (isMale ? 'male@test.com' : 'female@test.com') : `${firstName.toLowerCase()}.${surname.toLowerCase()}@test.com`;
  // We use fixed/generated IDs for seeding
  const id = isTestUser ? (isMale ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002') : uuid(); 
  const displayName = isTestUser ? (isMale ? "Test User (Male)" : "Test User (Female)") : `${firstName} ${surname}`;

  return {
    id,
    title: isMale ? 'Mr' : 'Miss',
    name: displayName,
    gender,
    email: email,
    password: 'password123',
    phone: `98${getRandomInt(10000000, 99999999)}`,
    
    // Physical
    age: getRandomInt(24, 32),
    height: isMale ? `5'${getRandomInt(7, 11)}"` : `5'${getRandomInt(1, 6)}"` ,
    weight: `${getRandomInt(50, 85)} kg`,
    skinColor: getRandom(['Fair', 'Wheatish', 'Dusky']),
    bloodGroup: getRandom(['A+', 'B+', 'O+', 'AB+']),
    diet: getRandom(['Vegetarian', 'Non-Vegetarian', 'Jain']),
    healthIssues: Math.random() > 0.8 ? ['Minor Vision'] : [],
    
    // Social
    caste,
    gotra: getRandom(GOTRAS_POOL),
    bio: getRandom(BIOS),
    
    // Location
    birthPlace: getRandom(CITIES),
    birthTime: `${getRandomInt(0, 23).toString().padStart(2, '0')}:${getRandomInt(0, 59).toString().padStart(2, '0')}`,
    nativeCountry: 'India',
    nativeState: STATES[city],
    nativeCity: city,
    currentCountry: 'India',
    currentState: STATES[city],
    currentCity: city,
    
    // Education & Career
    educationLevel: edu.level,
    educationStream: edu.stream,
    educationDegree: edu.degree,
    education: `${edu.level} in ${edu.stream}`,
    occupation: getRandom(OCCUPATIONS),
    salary: getRandom(SALARIES),
    
    // Family
    father: generateFamilyMember('Father', surname),
    mother: generateFamilyMember('Mother', surname),
    paternalSide: generateFamilyMember('Grandfather', surname),
    siblings: Math.random() > 0.5 ? [{ title: 'Mr', name: 'Sibling Name', caste, gotra: 'Same', occupation: 'Student' }] : [],
    
    // Preferences
    partnerAgeMin: (22).toString(),
    partnerAgeMax: (30).toString(),
    expectations: ['Educated', 'Family Oriented', 'Vegetarian'],
    
    avatar_url: `https://ui-avatars.com/api/?name=${displayName.replace(/ /g, '+')}&background=${isMale ? '0D8ABC' : 'E91E63'}&color=fff&size=300&font-size=0.33`,

    // Demo Flag
    is_demo: isTestUser
  };
};

export const generateProfiles = (): UserProfile[] => {
  const profiles: UserProfile[] = [];
  
  profiles.push(generateProfile('Male', 0, true));
  profiles.push(generateProfile('Female', 0, true));

  for (let i = 1; i < 10; i++) profiles.push(generateProfile('Male', i));
  for (let i = 1; i < 10; i++) profiles.push(generateProfile('Female', i));
  
  return profiles;
};
