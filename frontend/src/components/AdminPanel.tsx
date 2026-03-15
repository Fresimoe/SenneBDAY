import { useEffect, useState, useCallback, type FC, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fetchApi } from '../api';

interface Member {
  id: number;
  name: string;
  color: string;
}

interface Period {
  id: number;
  startDate: string;
  endDate: string;
}

interface AvailabilityEntry {
  id: number;
  date: string;
  member: Member;
}

const getStatus = (period: Period): 'active' | 'planned' | 'past' => {
  const now = new Date();
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  if (now > end) return 'past';
  if (now >= start) return 'active';
  return 'planned';
};

const statusBadge = (status: 'active' | 'planned' | 'past') => {
  const map = {
    active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    planned: 'bg-amber-100 text-amber-700 border border-amber-200',
    past: 'bg-red-100 text-red-600 border border-red-200',
  };
  return map[status];
};

const AdminPanel: FC = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Member form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newPin, setNewPin] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // Period form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodLoading, setPeriodLoading] = useState(false);

  // PIN change form
  const [currentPin, setCurrentPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const loadData = useCallback(async () => {
    try {
      const [m, p, a] = await Promise.all([
        fetchApi('/members'),
        fetchApi('/periods'),
        fetchApi('/availability')
      ]);
      setMembers(m);
      setPeriods(p.sort((a: Period, b: Period) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()));
      setAvailability(a);
    } catch (err: any) {
      showMessage(err.message || 'Failed to load data', true);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('role') !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate, loadData]);

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);
    try {
      await fetchApi('/members', {
        method: 'POST',
        body: JSON.stringify({ name: newName, color: newColor, pin: newPin }),
      });
      setNewName('');
      setNewColor('#3b82f6');
      setNewPin('');
      showMessage(`Member "${newName}" added.`);
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Failed to add member', true);
    } finally {
      setMemberLoading(false);
    }
  };

  const deleteMember = async (id: number, name: string) => {
    if (!confirm(`Remove member "${name}"? Their availability will also be deleted.`)) return;
    try {
      await fetchApi(`/members/${id}`, { method: 'DELETE' });
      showMessage(`Member "${name}" removed.`);
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Failed to delete', true);
    }
  };

  const addPeriod = async (e: FormEvent) => {
    e.preventDefault();
    setPeriodLoading(true);
    try {
      await fetchApi('/periods', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
      });
      setStartDate('');
      setEndDate('');
      showMessage('Period added.');
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Failed to add period', true);
    } finally {
      setPeriodLoading(false);
    }
  };

  const deletePeriod = async (id: number) => {
    if (!confirm('Delete this period?')) return;
    try {
      await fetchApi(`/periods/${id}`, { method: 'DELETE' });
      showMessage('Period deleted.');
      await loadData();
    } catch (err: any) {
      showMessage(err.message || 'Failed to delete', true);
    }
  };

  const changePin = async (e: FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    try {
      await fetchApi('/admin/pin', {
        method: 'PUT',
        body: JSON.stringify({ currentPin, newPin: newAdminPin }),
      });
      setCurrentPin('');
      setNewAdminPin('');
      showMessage('Admin PIN updated.');
    } catch (err: any) {
      showMessage(err.message || 'Failed to update PIN', true);
    } finally {
      setPinLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-800">Admin Panel</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Welcome, <strong>Admin</strong></span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm">{error}</div>
        </div>
      )}
      {success && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2 text-sm">{success}</div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Best Moments Summary */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🏆 Best 3 moments</h2>
          {(() => {
            const byDate: Record<string, { date: Date; members: Member[] }> = {};
            for (const entry of availability) {
              const key = entry.date.substring(0, 10);
              if (!byDate[key]) {
                byDate[key] = { date: new Date(entry.date), members: [] };
              }
              if (!byDate[key].members.find((m) => m.id === entry.member.id)) {
                byDate[key].members.push(entry.member);
              }
            }

            const sorted = Object.entries(byDate)
              .sort((a, b) => b[1].members.length - a[1].members.length)
              .slice(0, 3);

            if (sorted.length === 0) {
              return <p className="text-sm text-gray-400 italic">No availability marked yet.</p>;
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sorted.map(([key, { date, members: m }], i) => {
                  const pct = members.length > 0 ? Math.round((m.length / members.length) * 100) : 0;
                  return (
                    <div key={key} className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                        <span className="text-xs text-gray-500 font-medium">{m.length}/{members.length}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        {format(date, 'EEE d MMM')}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-emerald-500 h-1 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.slice(0, 4).map((member) => (
                          <span
                            key={member.id}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: member.color }}
                            title={member.name}
                          />
                        ))}
                        {m.length > 4 && <span className="text-[10px] text-gray-400">+{m.length - 4}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>

        {/* Members */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Members</h2>

          {/* Member List */}
          {members.length > 0 ? (
            <div className="space-y-2 mb-4">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-sm font-medium text-gray-800">{m.name}</span>
                  </div>
                  <button
                    onClick={() => deleteMember(m.id, m.name)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">No members yet.</p>
          )}

          {/* Add Member */}
          <form onSubmit={addMember} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Color</label>
              <input
                type="color"
                className="w-8 h-6 border-0 p-0 cursor-pointer"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
            </div>
            <input
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PIN (min 4 chars)"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
              minLength={4}
            />
            <button
              type="submit"
              disabled={memberLoading}
              className="bg-blue-500 text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {memberLoading ? 'Adding…' : 'Add Member'}
            </button>
          </form>
        </section>

        {/* Periods */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Availability Periods</h2>

          {periods.length > 0 ? (
            <div className="space-y-2 mb-4">
              {periods.map((p) => {
                const status = getStatus(p);
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${statusBadge(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-700">
                        {format(new Date(p.startDate), 'd MMM yyyy')} – {format(new Date(p.endDate), 'd MMM yyyy')}
                      </span>
                    </div>
                    <button
                      onClick={() => deletePeriod(p.id)}
                      className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic mb-4">No periods yet.</p>
          )}

          {/* Add Period */}
          <form onSubmit={addPeriod} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={periodLoading}
                className="w-full bg-blue-500 text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {periodLoading ? 'Adding…' : 'Add Period'}
              </button>
            </div>
          </form>
        </section>

        {/* Change Admin PIN */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Change Admin PIN</h2>
          <form onSubmit={changePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
            <input
              type="password"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New PIN (min 4 chars)"
              value={newAdminPin}
              onChange={(e) => setNewAdminPin(e.target.value)}
              required
              minLength={4}
            />
            <button
              type="submit"
              disabled={pinLoading}
              className="bg-gray-800 text-white font-medium rounded-lg px-4 py-2 text-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {pinLoading ? 'Updating…' : 'Update PIN'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
