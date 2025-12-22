import React, { useState } from 'react';
import { authenticateUser, setSession } from '../services/dataService';
import { User } from '../types';
import { Lock, User as UserIcon, AlertTriangle } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await authenticateUser(username, password);
    if (user) {
      setSession(user);
      onLogin(user);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Jewellery Tracker</h1>
          <p className="text-gray-500">Production Workflow System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-200">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};