import { type FC } from 'react';
import { format } from 'date-fns';

interface AvailabilityEntry {
  id: number;
  date: string;
  member: { id: number; name: string; color: string };
}

interface Member {
  id: number;
  name: string;
  color: string;
}

interface SidebarProps {
  availability: AvailabilityEntry[];
  members: Member[];
}

const Sidebar: FC<SidebarProps> = ({ availability, members }) => {
  const totalMembers = members.length;

  // Group by date
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

  return (
    <aside className="w-72 bg-white border border-gray-200 rounded-xl p-5 flex-shrink-0 self-start">
      <h2 className="text-base font-semibold text-gray-800 mb-4">🏆 Best 3 moments</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No availability marked yet.</p>
      ) : (
        <div className="space-y-4">
          {sorted.map(([key, { date, members: m }], i) => {
            const pct = totalMembers > 0 ? Math.round((m.length / totalMembers) * 100) : 0;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {format(date, 'EEE d MMM')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{m.length}/{totalMembers}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {m.map((member) => (
                    <span
                      key={member.id}
                      className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: member.color }}
                      />
                      {member.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
