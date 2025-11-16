import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (name: string, email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(name.trim() && email.trim()) {
        onLogin(name, email);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-background dark:bg-gray-900 p-4">
      <div className="text-center text-brand-text-primary dark:text-gray-100 mb-8">
        <h1 className="text-5xl font-bold text-brand-blue">Healoc</h1>
        <p className="text-lg text-brand-text-secondary dark:text-gray-400 mt-2">Your Digital Health Passport</p>
      </div>
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center text-brand-text-primary dark:text-gray-100 mb-6">
          Create Your Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-text-secondary dark:text-gray-400">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-text-primary dark:text-gray-100 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                placeholder="Alex Doe"
                required
              />
            </div>
          <div>
            <label className="text-sm font-medium text-brand-text-secondary dark:text-gray-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-brand-text-primary dark:text-gray-100 rounded-md focus:ring-brand-blue focus:border-brand-blue"
              placeholder="you@example.com"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg mt-4 hover:bg-opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-opacity-50"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
