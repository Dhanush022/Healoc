export interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'as_needed';
  times: string[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export type HealthRecordType = 'Lab Report' | 'Prescription' | "Doctor's Note" | 'Other';

export interface HealthRecord {
  id: string;
  type: HealthRecordType;
  name: string;
  date: string;
  details: string;
  fileUrl?: string;
  imageUrl?: string; // For uploaded/scanned images
}

export interface Allergy {
    id: string;
    name: string;
    severity: 'Mild' | 'Moderate' | 'High' | 'Severe';
    reaction: string;
}

export interface Vaccination {
    id:string;
    name: string;
    date: string;
    dose: string;
    batchNumber?: string;
}

export interface SymptomAnalysis {
  id: string;
  date: string;
  symptoms: string;
  imageAttached: boolean;
  result: string;
}

// Base profile for health-related information
export interface HealthProfile {
  id: string;
  name: string;
  dob: string;
  bloodType: string;
  emergencyContacts: EmergencyContact[];
  healthRecords: HealthRecord[];
  allergies: Allergy[];
  vaccinations: Vaccination[];
  medicationReminders: MedicationReminder[];
  symptomHistory: SymptomAnalysis[];
}

// A family member, extending the base health profile
export interface FamilyMember extends HealthProfile {
  relationship: 'Spouse' | 'Child' | 'Parent' | 'Other';
}

// The main user profile for the account holder
export interface UserProfile extends HealthProfile {
  email: string;
  familyMembers: FamilyMember[];
}


export enum Screen {
  Dashboard = 'DASHBOARD',
  Records = 'RECORDS',
  HealocAI = 'HEALOC_AI',
  QRCode = 'QR_CODE',
  Profile = 'PROFILE',
}

export type Theme = 'light' | 'dark';