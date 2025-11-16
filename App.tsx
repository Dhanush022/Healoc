import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, Screen, HealthProfile, FamilyMember, Theme } from './types';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import HealthRecords from './components/HealthRecords';
import HealocAI from './components/HealocAI';
import EmergencyCard from './components/EmergencyCard';
import Profile from './components/Profile';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import EmergencyMode from './components/EmergencyMode';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Dashboard);
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null); // null is the main user
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('healoc-theme') as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('healoc-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('healoc-theme', 'light');
    }
  }, [theme]);

  const handleCreateProfile = (name: string, email: string) => {
    const newUserProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      email,
      dob: '',
      bloodType: '',
      emergencyContacts: [],
      healthRecords: [],
      allergies: [],
      vaccinations: [],
      medicationReminders: [],
      familyMembers: [],
      symptomHistory: [],
    };
    setUser(newUserProfile);
    setActiveProfileId(newUserProfile.id); 
  };
  
  const activeProfile: HealthProfile | undefined = useMemo(() => {
    if (!user) {
        return undefined;
    }
    // Logic updated to explicitly check ID after profile creation fix
    if (activeProfileId === user.id) {
      const { familyMembers, email, ...mainProfile } = user;
      return mainProfile;
    }
    return user.familyMembers.find(member => member.id === activeProfileId);
  }, [user, activeProfileId]);


  if (!user) {
    return <LoginScreen onLogin={handleCreateProfile} />;
  }

  if (!activeProfile) {
     // A fallback for the brief moment after user is set but activeProfile isn't memoized yet
    const { familyMembers, email, ...mainProfile } = user;
    if (!activeProfileId || activeProfileId === user.id) {
       return <div className="p-4 text-center text-brand-text-secondary dark:text-gray-400">Loading {mainProfile.name}'s profile...</div>
    }
    return <div className="p-4 text-center text-brand-text-secondary dark:text-gray-400">Loading profile...</div>
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.Dashboard:
        return <Dashboard activeProfile={activeProfile} navigate={setCurrentScreen} />;
      case Screen.Records:
        return <HealthRecords activeProfile={activeProfile} user={user} setUser={setUser} />;
      case Screen.HealocAI:
        return <HealocAI activeProfile={activeProfile} user={user} setUser={setUser} />;
      case Screen.QRCode:
        return <EmergencyCard activeProfile={activeProfile} />;
      case Screen.Profile:
        return <Profile activeProfile={activeProfile} user={user} setUser={setUser} navigate={setCurrentScreen} theme={theme} setTheme={setTheme}/>;
      default:
        return <Dashboard activeProfile={activeProfile} navigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-brand-background text-brand-text-primary dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto h-screen flex flex-col bg-brand-background dark:bg-gray-900">
        <Header 
          title="Healoc" 
          user={user}
          activeProfile={activeProfile}
          setActiveProfileId={setActiveProfileId}
        />
        <main className="flex-grow p-5 overflow-y-auto pb-28">
          {renderScreen()}
        </main>
        <BottomNav activeScreen={currentScreen} setActiveScreen={setCurrentScreen} onEmergency={() => setIsEmergencyMode(true)} />
      </div>
      {isEmergencyMode && <EmergencyMode activeProfile={activeProfile} onClose={() => setIsEmergencyMode(false)} />}
    </div>
  );
};

export default App;