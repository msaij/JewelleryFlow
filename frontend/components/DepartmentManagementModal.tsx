import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { getDepartments, createDepartment, deleteDepartment } from '../services/dataService';
import { X, Plus, Trash2, Building } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onDepartmentsChange: () => void; // Trigger parent refresh
}

export const DepartmentManagementModal: React.FC<Props> = ({ isOpen, onClose, onDepartmentsChange }) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        try {
            const data = await getDepartments();
            setDepartments(data);
        } catch (e) {
            console.error("Failed to load departments", e);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        // UI Safety: Confirm user intention before modification
        if (!confirm(`Create new department "${newDeptName.trim()}"?`)) return;

        setLoading(true);
        try {
            await createDepartment(newDeptName.trim());
            setNewDeptName('');
            await loadData();
            onDepartmentsChange(); // Notify parent
        } catch (e: any) {
            alert("Failed to add department: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        // UI Safety: Confirm deletion. Backend has strict usage checks.
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            await deleteDepartment(id);
            await loadData();
            onDepartmentsChange(); // Notify parent
        } catch (e: any) {
            alert("Failed to delete: " + e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div className="flex items-center gap-2">
                        <Building className="text-indigo-600" size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Manage Departments</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <input
                            type="text"
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            placeholder="New Department Name"
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !newDeptName.trim()}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            <Plus size={18} /> Add
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {departments.filter(d => d.name.toLowerCase().includes(newDeptName.toLowerCase())).length === 0 ? (
                            <p className="text-center text-gray-500 py-4">
                                {newDeptName ? "No matching departments." : "No departments found."}
                            </p>
                        ) : (
                            departments
                                .filter(d => d.name.toLowerCase().includes(newDeptName.toLowerCase()))
                                .map(dept => (
                                    <div key={dept.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                        <span className="font-medium text-gray-800">{dept.name}</span>
                                        <button
                                            onClick={() => handleDelete(dept.id, dept.name)}
                                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Delete Department"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 text-center">
                    <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
