import React, { useState, useEffect } from 'react';
import { User, STAGES, Role } from '../types';
import { getUsers, addUser, removeUser, updateUser } from '../services/dataService';
import { Trash2, UserPlus, Shield, User as UserIcon, Edit, Save, X } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Worker');
  const [assignedStage, setAssignedStage] = useState<string>(STAGES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    const userData: User = {
      id: editingId || Date.now().toString(),
      name,
      username,
      password,
      role,
      assignedStage: role === 'Worker' ? assignedStage : undefined
    };

    try {
      if (editingId) {
        await updateUser(userData);
        alert("User updated successfully!");
      } else {
        await addUser(userData);
        alert("User added successfully!");
      }
      await loadUsers();
      resetForm();
    } catch (e: any) {
      alert(e.message || "Operation failed");
    }
  };

  const handleEditClick = (user: User) => {
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setAssignedStage(user.assignedStage || STAGES[0]);
    setEditingId(user.id);
    setIsAdding(true);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await removeUser(id);
      await loadUsers();
    } catch (e: any) {
      alert(e.message || "Delete failed");
    }
  };

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('Worker');
    setAssignedStage(STAGES[0]);
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Staff Management</h2>
        <button
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isAdding ? 'bg-gray-100 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {isAdding ? <X size={16} /> : <UserPlus size={16} />}
          {isAdding ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-4">
            {editingId ? <Edit size={20} className="text-indigo-600" /> : <UserPlus size={20} className="text-indigo-600" />}
            <h3 className="font-semibold text-gray-900">{editingId ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
          </div>

          <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Username (Login ID)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. john"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Secret password"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Worker">Worker</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {role === 'Worker' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Assigned Department</label>
                <select
                  value={assignedStage}
                  onChange={(e) => setAssignedStage(e.target.value)}
                  className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STAGES.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold shadow-md shadow-indigo-100">
                <Save size={16} />
                {editingId ? 'Update User' : 'Save User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      {user.role === 'Admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {user.role} {user.assignedStage && `(${user.assignedStage})`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-2 rounded-full mr-2 transition-colors"
                    title="Edit User"
                  >
                    <Edit size={16} />
                  </button>

                  {/* Delete Button - Only show if not self (Admin) to prevent full lockout, though real apps check ID */}
                  {user.username !== 'Admin' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};