'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  onSwitch: () => void;
};

export default function RegisterPage({ onSwitch }: Props) {
  const { register, isLoading } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded">
      <h2 className="text-xl mb-4">Register</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block mb-1">First Name</label>
          <input
            className="w-full border px-2 py-1"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Last Name</label>
          <input
            className="w-full border px-2 py-1"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Username</label>
          <input
            className="w-full border px-2 py-1"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="w-full border px-2 py-1"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-1 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="mt-4">
        Already have an account?{' '}
        <button className="text-blue-600 underline" onClick={onSwitch}>
          Log in here
        </button>
      </p>
    </div>
  );
}
