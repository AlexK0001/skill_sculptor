// src/components/SkillDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useApi } from '../lib/api';
import type { User, Skill } from '../lib/types.ts';


interface SkillCardProps {
  skill: Skill;
  onUpdate: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
}

const SkillCard = ({ skill, onUpdate, onDelete }: SkillCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkill, setEditedSkill] = useState(skill);
  const api = useApi();

  const handleSave = async () => {
    try {
      const updated = await api.updateSkill(skill.id, editedSkill);
      onUpdate(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update skill:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цю навичку?')) {
      try {
        await api.deleteSkill(skill.id);
        onDelete(skill.id);
      } catch (error) {
        console.error('Failed to delete skill:', error);
      }
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 8) return 'bg-purple-100 text-purple-800';
    if (level >= 5) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {isEditing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editedSkill.name}
            onChange={(e) => setEditedSkill({ ...editedSkill, name: e.target.value })}
            className="w-full text-xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
          />
          <textarea
            value={editedSkill.description || ''}
            onChange={(e) => setEditedSkill({ ...editedSkill, description: e.target.value })}
            className="w-full text-gray-600 bg-gray-50 border border-gray-300 rounded-md p-2 focus:border-blue-500 outline-none"
            placeholder="Опис навички..."
            rows={3}
          />
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Прогрес:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={editedSkill.progress}
              onChange={(e) => setEditedSkill({ ...editedSkill, progress: parseInt(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-600 w-12">
              {editedSkill.progress}%
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Зберегти
            </button>
            <button
              onClick={() => {
                setEditedSkill(skill);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{skill.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{skill.description || 'Без опису'}</p>
              <div className="flex items-center space-x-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(skill.level)}`}>
                  Рівень {skill.level}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Редагувати"
              >
                ✏️
              </button>
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Видалити"
              >
                🗑️
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Прогрес</span>
              <span className="font-medium">{skill.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(skill.progress)}`}
                style={{ width: `${skill.progress}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AddSkillForm = ({ onAdd }: { onAdd: (skill: Skill) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    progress: 0,
  });
  const api = useApi();
  const currentUser = api.getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const newSkill = await api.createSkill(currentUser.id, {
        name: formData.name,
        description: formData.description,
        level: 1,
        progress: formData.progress,
      });
      onAdd(newSkill);
      setFormData({ name: '', description: '', progress: 0 });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create skill:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">+</div>
            <div className="font-medium">Додати нову навичку</div>
          </div>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва навички
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="Наприклад: JavaScript"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Опис
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 outline-none"
              placeholder="Опишіть, що ви хочете вивчити..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Початковий прогрес: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Додати навичку
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setFormData({ name: '', description: '', progress: 0 });
              }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
            >
              Скасувати
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const SkillDashboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByLevel, setFilterByLevel] = useState<number | null>(null);
  const api = useApi();
  const currentUser = api.getCurrentUser();

  useEffect(() => {
    const loadSkills = async () => {
      if (!currentUser) return;
      
      try {
        const userSkills = await api.getSkills(currentUser.id);
        setSkills(userSkills);
      } catch (error) {
        console.error('Failed to load skills:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [currentUser, api]);

  const handleSkillUpdate = (updatedSkill: Skill) => {
    setSkills(prev => prev.map(skill => 
      skill.id === updatedSkill.id ? updatedSkill : skill
    ));
  };

  const handleSkillDelete = (skillId: string) => {
    setSkills(prev => prev.filter(skill => skill.id !== skillId));
  };

  const handleSkillAdd = (newSkill: Skill) => {
    setSkills(prev => [...prev, newSkill]);
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (skill.description && skill.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = filterByLevel === null || skill.level === filterByLevel;
    return matchesSearch && matchesLevel;
  });

  const stats = {
    total: skills.length,
    completed: skills.filter(s => s.progress === 100).length,
    inProgress: skills.filter(s => s.progress > 0 && s.progress < 100).length,
    avgProgress: skills.length > 0 ? Math.round(skills.reduce((acc, s) => acc + s.progress, 0) / skills.length) : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Мої навички
        </h1>
        <p className="text-gray-600">
          Відстежуйте свій прогрес і розвивайте нові навички
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600">Всього навичок</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-gray-600">Завершено</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-gray-600">В процесі</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
          <div className="text-gray-600">Середній прогрес</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Пошук навичок..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <select
              value={filterByLevel || ''}
              onChange={(e) => setFilterByLevel(e.target.value ? parseInt(e.target.value) : null)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 outline-none"
            >
              <option value="">Всі рівні</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                <option key={level} value={level}>Рівень {level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AddSkillForm onAdd={handleSkillAdd} />
        
        {filteredSkills.map(skill => (
          <SkillCard
            key={skill.id}
            skill={skill}
            onUpdate={handleSkillUpdate}
            onDelete={handleSkillDelete}
          />
        ))}
      </div>

      {filteredSkills.length === 0 && skills.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            Навички за заданими фільтрами не знайдено
          </div>
        </div>
      )}

      {skills.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            У вас поки що немає навичок
          </div>
          <div className="text-gray-400">
            Додайте свою першу навичку, щоб почати відстежувати прогрес!
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillDashboard;