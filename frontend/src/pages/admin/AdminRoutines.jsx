import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getRoutine, updateRoutine } from '../../api/routines';

const DEFAULT_SCHEDULE = [
  { time: '9:00 – 10:00',   mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' },
  { time: '10:00 – 11:00',  mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' },
  { time: '11:00 – 12:00',  mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' },
  { time: '12:00 – 13:00',  mon:'LUNCH', tue:'LUNCH', wed:'LUNCH', thu:'LUNCH', fri:'LUNCH' },
  { time: '13:00 – 14:00',  mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' },
  { time: '14:00 – 15:00',  mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' },
];

export default function AdminRoutines() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const { data: routineData, isLoading } = useQuery({
    queryKey: ['routine', user?.batch],
    queryFn: () => getRoutine(user?.batch).then(r => r.data),
    enabled: !!user?.batch
  });

  useEffect(() => {
    if (routineData?.data?.length > 0) {
      setSchedule(routineData.data);
    } else if (routineData?.data?.length === 0) {
      setSchedule([...DEFAULT_SCHEDULE]);
    }
  }, [routineData]);

  const updateMut = useMutation({
    mutationFn: (newSchedule) => updateRoutine(user.batch, newSchedule),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routine'] });
      setIsEditing(false);
    }
  });

  const handleCellChange = (rowIndex, day, value) => {
    const updated = [...schedule];
    updated[rowIndex] = { ...updated[rowIndex], [day]: value };
    setSchedule(updated);
  };

  const addRow = () => {
    setSchedule([...schedule, { time: 'New Time', mon:'—', tue:'—', wed:'—', thu:'—', fri:'—' }]);
  };

  const removeRow = (index) => {
    const updated = schedule.filter((_, i) => i !== index);
    setSchedule(updated);
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display font-semibold text-[28px] tracking-tight text-ink">Class Routine</h1>
        {isEditing ? (
          <div className="flex gap-3">
            <button onClick={() => { setSchedule(routineData?.data?.length > 0 ? routineData.data : [...DEFAULT_SCHEDULE]); setIsEditing(false); }} className="button-secondary">Cancel</button>
            <button onClick={() => updateMut.mutate(schedule)} disabled={updateMut.isPending} className="button-primary">
              {updateMut.isPending ? 'Saving...' : 'Save Routine'}
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="button-primary">
            Edit Routine
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-divider-soft rounded-[20px] bg-surface-pearl">
        <table className="w-full min-w-[600px] border-collapse text-[14px] font-sans">
          <thead>
            <tr className="border-b border-divider-soft bg-canvas">
              <th className="font-bold text-ink-muted-80 text-left py-4 px-6 w-40">Time</th>
              {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                <th key={d} className="font-bold text-ink-muted-80 text-center py-4 px-2">{d}</th>
              ))}
              {isEditing && <th className="py-4 px-2"></th>}
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, i) => (
              <tr key={i} className="border-b border-divider-soft last:border-b-0 hover:bg-canvas-parchment transition-colors">
                <td className="py-3 px-4">
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={row.time} 
                      onChange={e => handleCellChange(i, 'time', e.target.value)}
                      className="w-full bg-canvas border border-divider-soft text-ink px-3 py-1.5 rounded-md focus:outline-none focus:border-primary" 
                    />
                  ) : (
                    <span className="font-semibold text-ink pl-2">{row.time}</span>
                  )}
                </td>
                {['mon','tue','wed','thu','fri'].map(day => (
                  <td key={day} className="py-3 px-2">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={row[day]} 
                        onChange={e => handleCellChange(i, day, e.target.value)}
                        className="w-full text-center bg-canvas border border-divider-soft text-ink px-2 py-1.5 rounded-md focus:outline-none focus:border-primary" 
                      />
                    ) : (
                      <div className="text-center text-ink-muted-80 font-medium">
                        {row[day] === '—' || !row[day] ? <span className="opacity-30">—</span> : row[day]}
                      </div>
                    )}
                  </td>
                ))}
                {isEditing && (
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700 bg-red-500/10 px-2 py-1 rounded-md text-[12px] font-bold">✕</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isEditing && (
        <div className="mt-4 flex justify-center">
          <button onClick={addRow} className="font-sans text-[13px] font-bold text-primary hover:text-ink bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors">
            + Add Timeslot
          </button>
        </div>
      )}
    </div>
  );
}
