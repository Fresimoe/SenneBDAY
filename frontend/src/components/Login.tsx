import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'member' | 'admin'>('member');
  const [memberName, setMemberName] = useState('');
  const [memberPin, setMemberPin] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = React.useState<{ id: number; name: string; color: string }[]>([]);

  React.useEffect(() => {
    fetchApi('/members')
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/member', {
        method: 'POST',
        body: JSON.stringify({ name: memberName, pin: memberPin }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'member');
      localStorage.setItem('memberName', data.member.name);
      localStorage.setItem('memberId', String(data.member.id));
      localStorage.setItem('memberColor', data.member.color);
      navigate('/calendar');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await fetchApi('/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ pin: adminPin }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'admin');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Group Availability</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to mark your availability</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'member' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setTab('member'); setError(''); }}
          >
            Member
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'admin' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setTab('admin'); setError(''); }}
          >
            Admin
          </button>
        </div>

        {/* Member Login */}
        {tab === 'member' && (
          <form onSubmit={handleMemberLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select your name</label>
              {members.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No members yet. Ask admin to add you.</p>
              ) : (
                <select
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                  required
                >
                  <option value="" disabled>Select your name</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
              <input
                type="password"
                value={memberPin}
                onChange={(e) => setMemberPin(e.target.value)}
                placeholder="Enter your PIN"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !memberName}
              className="w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Admin Login */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN</label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter admin PIN"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <p className="text-xs text-gray-400">First login creates the admin account with this PIN.</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in as Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
