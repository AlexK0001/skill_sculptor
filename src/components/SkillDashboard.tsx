// src/components/SkillDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useApi } from '../lib/api';
import type { Skill } from '../lib/types';

interface SkillCardProps {
  skill: Skill;
  onUpdate: (skill: Skill) => void;
  onDelete: (skillId: string) => void;
}

const SkillCard = ({ skill, onUpdate, onDelete }: SkillCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSkill, setEditedSkill] = useState<Skill>(skill);
  const api = useApi();

  const handleSave = async () => {
    try {
      const updatedRes = await api.updateSkill(skill.id, editedSkill);
      if (updatedRes.error) {
        console.error(updatedRes.error);
      } else if (updatedRes.data) {
        onUpdate(updatedRes.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update skill', err);
    }
  };

  const handleDelete = async () => {
    try {
      const delRes = await api.deleteSkill(skill.id);
      if (delRes.error) {
        console.error(delRes.error);
      } else {
        onDelete(skill.id);
      }
    } catch (err) {
      console.error('Failed to delete skill', err);
    }
  };

  return (
    <div className="p-4 border rounded">
      {isEditing ? (
        <>
          <input value={editedSkill.name} onChange={e => setEditedSkill({ ...editedSkill, name: e.target.value })} />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => { setIsEditing(false); setEditedSkill(skill); }}>Cancel</button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">{skill.name}</h3>
          <p>{skill.description}</p>
          <div className="flex space-x-2 mt-2">
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </div>
        </>
      )}
    </div>
  );
};

const AddSkillForm = ({ onAdd }: { onAdd: (skill: Skill) => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const api = useApi();
  const currentUser: any = api.getCurrentUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await api.createSkill(currentUser.id, { name, description, progress });
      if (res.error) {
        console.error(res.error);
      } else if (res.data) {
        onAdd(res.data);
        setName('');
        setDescription('');
        setProgress(0);
      }
    } catch (err) {
      console.error('Create skill failed', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Skill name" />
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <input type="number" value={progress} onChange={e => setProgress(Number(e.target.value))} />
      <button type="submit">Add</button>
    </form>
  );
};

const SkillDashboard = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const currentUser: any = api.getCurrentUser();

  useEffect(() => {
    const loadSkills = async () => {
      if (!currentUser) {
        setSkills([]);
        setLoading(false);
        return;
      }
      try {
        const getRes = await api.getSkills(currentUser.id);
        if (getRes.error) {
          console.error(getRes.error);
          setSkills([]);
        } else {
          setSkills(getRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load skills:', err);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [api, currentUser]);

  const handleSkillUpdate = (updated: Skill) => {
    setSkills(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const handleSkillDelete = (skillId: string) => {
    setSkills(prev => prev.filter(s => s.id !== skillId));
  };

  const handleSkillAdd = (newSkill: Skill) => {
    setSkills(prev => [...prev, newSkill]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Skills</h2>

      <AddSkillForm onAdd={handleSkillAdd} />

      <div className="grid grid-cols-1 gap-4 mt-6">
        {skills.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">You have no skills yet</div>
            <div className="text-gray-400">Add one to start tracking progress!</div>
          </div>
        ) : (
          skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onUpdate={handleSkillUpdate}
              onDelete={handleSkillDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SkillDashboard;
