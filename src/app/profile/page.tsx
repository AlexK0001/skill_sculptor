"use client";
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, age, gender })
      });
      if (res.ok) {
        login(token as string, { ...user, name, age, gender });
        setMessage('Профіль успішно оновлено!');
      } else {
        setMessage('Помилка оновлення профілю.');
      }
    } catch {
      setMessage('Помилка сервера.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Будь ласка, увійдіть.</div>;

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Мій профіль</h1>
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <Label>Email</Label>
          <Input disabled value={user.email} className="mt-1" />
          <p className="text-sm text-muted-foreground mt-1">Email не можна змінити.</p>
        </div>
        <div>
          <Label>Ім&apos;я</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Ваше ім&apos;я" 
            className="mt-1"
          />
        </div>
        <div>
          <Label>Вік</Label>
          <Input 
            type="number"
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
            placeholder="Ваш вік" 
            className="mt-1"
          />
        </div>
        <div>
          <Label>Стать</Label>
          <select 
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full flex h-10 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Не вказано</option>
            <option value="Чоловіча">Чоловіча</option>
            <option value="Жіноча">Жіноча</option>
            <option value="Інша">Інша</option>
          </select>
        </div>
        {message && <p className="text-sm text-primary">{message}</p>}
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Збереження...' : 'Зберегти зміни'}
        </Button>
      </div>
    </div>
  );
}
