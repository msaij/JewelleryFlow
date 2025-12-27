import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Department } from '../types';
import { getUsers, addUser, removeUser, updateUser, getDepartments } from '../services/dataService';
import { Trash2, UserPlus, Shield, User as UserIcon, Edit, Save, X, Filter, FolderPlus, Settings } from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { DepartmentManagementModal } from './DepartmentManagementModal';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Worker');
  const [assignedStage, setAssignedStage] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedWorker, setSelectedWorker] = useState<string>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadUsers(), loadDepartments()]);
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      // Sort by Role (Alphabetical: Admin -> Worker) then Name
      const sorted = data.sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.name.localeCompare(b.name);
      });
      setUsers(sorted);
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(sorted);
      // Set default assigned stage if empty and departments exist
      if (!assignedStage && sorted.length > 0) {
        setAssignedStage(sorted[0].name);
      }
    } catch (e) {
      console.error("Failed to load departments", e);
    }
  };

  // Filter users based on selected filters (Stage and Worker name)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Stage Filter Application
      if (selectedStage !== 'All') {
        // If a stage is selected, valid only if user is a Worker in that stage
        // Admins are hidden when a specific stage is selected as they don't belong to stages
        if (user.role === 'Worker' && user.assignedStage !== selectedStage) return false;
        if (user.role !== 'Worker') return false;
      }

      // Worker Name Filter Application
      if (selectedWorker !== 'All' && user.name !== selectedWorker) return false;

      return true;
    });
  }, [users, selectedStage, selectedWorker]);

  // Derived list of potential workers for the dropdown, strictly filtered by selected stage
  const availableWorkers = useMemo(() => {
    let list = users;
    // If strict stage filter is on, only show workers belonging to that stage in the dropdown
    if (selectedStage !== 'All') {
      list = list.filter(u => u.role === 'Worker' && u.assignedStage === selectedStage);
    }
    return list;
  }, [users, selectedStage]);


  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) return;

    const userData: User = {
      id: editingId || '', // Empty ID tells backend to generate one
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
    setPassword(''); // Don't populate existing password for security/technical reasons
    setRole(user.role);
    setAssignedStage(user.assignedStage || (departments[0]?.name || ''));
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
    setAssignedStage(departments[0]?.name || '');
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Staff Management</h2>
          <p className="text-sm text-gray-500">Manage access and department assignments</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">

          {/* Manage Departments Button */}
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 flex items-center gap-1 transition-colors"
            title="Manage Departments"
          >
            <Settings size={18} />
            <span className="hidden sm:inline text-xs font-bold">Departments</span>
          </button>

          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[140px]"
            >
              <option value="All">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          {/* Worker Filter */}
          <SearchableSelect
            options={availableWorkers.map(u => ({ id: u.id, label: u.name, value: u.name }))}
            value={selectedWorker}
            onChange={setSelectedWorker}
            label="Staff"
            className="min-w-[160px]"
          />

          {/* Reset Filter */}
          {(selectedStage !== 'All' || selectedWorker !== 'All') && (
            <button
              onClick={() => { setSelectedStage('All'); setSelectedWorker('All'); }}
              className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg shrink-0"
              title="Clear Filters"
            >
              <Filter size={16} />
            </button>
          )}

          <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>

          <button
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${isAdding ? 'bg-gray-100 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isAdding ? <X size={16} /> : <UserPlus size={16} />}
            {isAdding ? 'Cancel' : 'Add New'}
          </button>
        </div>
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
                  <option value="" disabled>Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative -z-0">
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
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
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  No users found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DepartmentManagementModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        onDepartmentsChange={loadDepartments}
      />

    </div>
  );
};