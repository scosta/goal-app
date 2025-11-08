import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRecordProgress } from '../api/progress';
import { useGoals } from '../api/goals';

// Schema for recording progress
const recordProgressSchema = z.object({
  goalId: z.string().min(1, 'Goal is required'),
  date: z.string().min(1, 'Date is required'),
  minutesSpent: z.number().int().min(0, 'Must be 0 or more minutes'),
  note: z.string().optional(),
});

type RecordProgressFormData = z.infer<typeof recordProgressSchema>;

export default function RecordProgress() {
  const { data: goalsData, isLoading: goalsLoading } = useGoals();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecordProgressFormData>({
    resolver: zodResolver(recordProgressSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today's date
      minutesSpent: 0,
    },
  });

  const mutation = useRecordProgress();

  const onSubmit = handleSubmit((data) => {
    // Convert empty note to undefined
    const payload = {
      ...data,
      note: data.note === '' ? undefined : data.note,
    };
    
    mutation.mutate(payload, {
      onSuccess: () => {
        reset(); // Clear form on success
      },
    });
  });

  const goals = goalsData?.goals || [];

  if (goalsLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <h2>Record Progress</h2>
        <p>Loading goals...</p>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <h2>Record Progress</h2>
        <p>No goals found. Create a goal first to record progress.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Record Progress</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="goalId">Goal *</label>
          <select
            id="goalId"
            {...register('goalId')}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          >
            <option value="">Select a goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title} ({goal.targetMinutesPerDay} min/day)
              </option>
            ))}
          </select>
          {errors.goalId && (
            <p style={{ color: 'red', fontSize: '14px' }}>{errors.goalId.message}</p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="date">Date *</label>
          <input
            id="date"
            type="date"
            {...register('date')}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.date && (
            <p style={{ color: 'red', fontSize: '14px' }}>{errors.date.message}</p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="minutesSpent">Minutes Spent *</label>
          <input
            id="minutesSpent"
            type="number"
            {...register('minutesSpent', { valueAsNumber: true })}
            min="0"
            placeholder="0"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.minutesSpent && (
            <p style={{ color: 'red', fontSize: '14px' }}>{errors.minutesSpent.message}</p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="note">Note (Optional)</label>
          <textarea
            id="note"
            {...register('note')}
            placeholder="Add a note about your progress..."
            style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }}
          />
          {errors.note && (
            <p style={{ color: 'red', fontSize: '14px' }}>{errors.note.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            padding: '12px 24px',
            backgroundColor: mutation.isPending ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {mutation.isPending ? 'Recording...' : 'Record Progress'}
        </button>

        {mutation.isError && (
          <p style={{ color: 'red', marginTop: '8px' }}>
            Error: {mutation.error?.message || 'Failed to record progress'}
          </p>
        )}

        {mutation.isSuccess && (
          <p style={{ color: 'green', marginTop: '8px' }}>
            Progress recorded successfully!
          </p>
        )}
      </form>
    </div>
  );
}

