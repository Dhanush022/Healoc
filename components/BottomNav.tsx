import React from 'react';
import { Screen } from '../types';
import HomeIcon from './icons/HomeIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import SparklesIcon from './icons/SparklesIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import PlusIcon from './icons/PlusIcon';

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  onEmergency: () => void;
}

const NavItem: React.FC<{
  screen: Screen;
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ screen, activeScreen, setActiveScreen, icon, label }) => {
  const isActive = activeScreen === screen;
  const color = isActive ? 'text-brand-blue' : 'text-brand-text-secondary dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue';
  return (
    <button
      onClick={() => setActiveScreen(screen)}
      className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${color}`}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen, onEmergency }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-brand-surface/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200/80 dark:border-gray-700/80">
      <div className="flex h-24 items-center justify-around">
        <NavItem screen={Screen.Dashboard} activeScreen={activeScreen} setActiveScreen={setActiveScreen} icon={<HomeIcon className="w-7 h-7 mb-1" />} label="Home" />
        <NavItem screen={Screen.Records} activeScreen={activeScreen} setActiveScreen={setActiveScreen} icon={<DocumentTextIcon className="w-7 h-7 mb-1" />} label="Records" />
        <div className="w-20 flex justify-center">
            <button 
              onClick={onEmergency}
              className="relative flex items-center justify-center w-16 h-16 rounded-full bg-brand-red text-white -translate-y-8 shadow-2xl shadow-red-300 dark:shadow-red-900 hover:bg-red-600 transition-transform transform hover:scale-110"
              aria-label="Emergency"
            >
              <PlusIcon className="w-9 h-9" />
              <span className="absolute -bottom-5 text-xs font-bold text-brand-red">EMERGENCY</span>
            </button>
        </div>
        <NavItem screen={Screen.HealocAI} activeScreen={activeScreen} setActiveScreen={setActiveScreen} icon={<SparklesIcon className="w-7 h-7 mb-1" />} label="AI" />
        <NavItem screen={Screen.Profile} activeScreen={activeScreen} setActiveScreen={setActiveScreen} icon={<UserCircleIcon className="w-7 h-7 mb-1" />} label="Profile" />
      </div>
    </footer>
  );
};

export default BottomNav;