import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, HealthProfile } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface HeaderProps {
  title: string;
  user: UserProfile;
  activeProfile: HealthProfile;
  setActiveProfileId: (id: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, activeProfile, setActiveProfileId }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectProfile = (id: string | null) => {
    setActiveProfileId(id === user.id ? null : id);
    setIsDropdownOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <header className="bg-brand-background dark:bg-gray-900 sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-md mx-auto h-16 flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold text-brand-blue truncate">{title}</h1>
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <UserCircleIcon className="w-8 h-8 text-brand-blue" />
            <span className="text-sm font-medium hidden sm:block dark:text-gray-200">{activeProfile.name}</span>
            <ChevronDownIcon className={`w-5 h-5 text-brand-text-secondary dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-1 border border-gray-100 dark:border-gray-700">
              <button onClick={() => handleSelectProfile(user.id)} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {user.name} (You)
              </button>
              {user.familyMembers.map(member => (
                <button key={member.id} onClick={() => handleSelectProfile(member.id)} className="w-full text-left px-4 py-2 text-sm text-brand-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {member.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;