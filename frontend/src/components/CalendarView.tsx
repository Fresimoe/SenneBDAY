import { useEffect, useState, useCallback, type FC } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../api';
import Sidebar from './Sidebar';

interface Period {
  id: number;
  startDate: string;
  endDate: string;
}

interface Member {
  id: number;
  name: string;
  color: string;
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
  if (now >= start && now <= end) return 'active';
  return 'planned';
};

const CalendarView: FC = () => {
  const navigate = useNavigate();
  const memberId = Number(localStorage.getItem('memberId'));
  const memberName = localStorage.getItem('memberName') || '';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const loadData = useCallback(async () => {
    try {
      const [p, m, a] = await Promise.all([
        fetchApi('/periods'),
        fetchApi('/members'),
        fetchApi('/availability'),
      ]);
      setPeriods(p || []);
      setMembers(m || []);
      setAvailability(a || []);

      // Navigate to first active/upcoming period
      const relevant = (p || [])
        .filter((per: Period) => getStatus(per) !== 'past')
        .sort((a: Period, b: Period) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      if (relevant && relevant.length > 0) {
        setCurrentDate(new Date(relevant[0].startDate));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!memberId) { navigate('/'); return; }
    loadData();
  }, [memberId, navigate, loadData]);

  const isDayInPeriod = (day: Date): Period | null => {
    return periods.find((p) => {
      const start = new Date(p.startDate);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(p.endDate);
      end.setUTCHours(23, 59, 59, 999);
      return day >= start && day <= end;
    }) || null;
  };

  const isMyDay = (day: Date): boolean =>
    availability.some((a) => a.member.id === memberId && isSameDay(new Date(a.date), day));

  const othersOnDay = (day: Date): Member[] =>
    availability
      .filter((a) => a.member.id !== memberId && isSameDay(new Date(a.date), day))
      .map((a) => a.member)
      .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);

  const toggleDay = async (day: Date) => {
    const period = isDayInPeriod(day);
    if (!period) return;
    const status = getStatus(period);
    if (status === 'past') return;

    const dateStr = format(day, "yyyy-MM-dd'T'00:00:00.000'Z'");
    const key = format(day, 'yyyy-MM-dd');
    setToggling(key);
    try {
      await fetchApi('/availability', {
        method: 'POST',
        body: JSON.stringify({ date: dateStr }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  };

  // Notice banner logic
  const renderBanner = () => {
    const active = periods.find((p) => getStatus(p) === 'active');
    const planned = periods
      .filter((p) => getStatus(p) === 'planned')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    if (active) {
      return (
        <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          ✅ Active period until <strong>{format(new Date(active.endDate), 'd MMM yyyy')}</strong>. Click days to mark your availability.
        </div>
      );
    }
    if (planned) {
      return (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          📅 You can fill in availability from <strong>{format(new Date(planned.startDate), 'd MMM yyyy')}</strong> until <strong>{format(new Date(planned.endDate), 'd MMM yyyy')}</strong>.
        </div>
      );
    }
    return (
      <div className="mb-4 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600">
        All periods have ended.
      </div>
    );
  };

  // Build calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (loading) {
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
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-800">Group Calendar</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Welcome, <strong>{memberName}</strong></span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 transition-colors">
            Log out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Calendar */}
        <div className="flex-1">
          {renderBanner()}

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {dayHeaders.map((h) => (
              <div key={h} className="text-center text-xs font-semibold text-gray-400 py-2">
                {h}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const period = isDayInPeriod(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const mine = isMyDay(day);
              const others = othersOnDay(day);
              const status = period ? getStatus(period) : null;
              const clickable = !!period && status !== 'past';
              const key = format(day, 'yyyy-MM-dd');
              const isToggling = toggling === key;

              let bgClass = 'bg-white';
              if (!isCurrentMonth) bgClass = 'bg-gray-50';
              else if (mine) bgClass = 'bg-emerald-500';
              else if (period) bgClass = 'bg-emerald-100';
              else bgClass = 'bg-gray-100';

              return (
                <div
                  key={key}
                  onClick={() => clickable && toggleDay(day)}
                  className={`relative min-h-[64px] rounded-lg p-1.5 flex flex-col ${bgClass} ${
                    clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  } ${!isCurrentMonth ? 'opacity-40' : ''} transition-opacity`}
                >
                  <span className={`text-xs font-medium mb-1 ${mine ? 'text-white' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  {isToggling && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Member dots */}
                  {others.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {others.map((m) => (
                        <span
                          key={m.id}
                          title={m.name}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
              <span>Available period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span>Your selection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar availability={availability} members={members} />
      </div>
    </div>
  );
};

export default CalendarView;
