import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateGoal } from '../api/goals';
import { useUserStore } from '../stores/userStore';

// Create goal schema without id, userId, and createdAt
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetMinutesPerDay: z.number().int().min(1, 'Must be at least 1 minute'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type CreateGoalFormData = z.infer<typeof createGoalSchema>;

function CreateGoal() {
  const { user } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGoalFormData>({ 
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      targetMinutesPerDay: 30,
      startDate: new Date().toISOString().split('T')[0], // Today's date
    }
  });

  const mutation = useCreateGoal();

  // Use authenticated user if available, otherwise fall back to test user
  const getUserId = () => {
    return user?.uid || 'test-user';
  };

  const onSubmit = handleSubmit((data) => {
    mutation.mutate({
      ...data,
      userId: getUserId(),
    }, {
      onSuccess: () => {
        reset(); // Clear form on success
      },
    });
  });

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Create New Goal</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="title">Title *</label>
          <input 
            id="title"
            {...register('title')} 
            placeholder="Enter goal title" 
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.title && <p style={{ color: 'red', fontSize: '14px' }}>{errors.title.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="description">Description</label>
          <textarea 
            id="description"
            {...register('description')} 
            placeholder="Enter goal description" 
            style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '80px' }}
          />
          {errors.description && <p style={{ color: 'red', fontSize: '14px' }}>{errors.description.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="targetMinutesPerDay">Target Minutes Per Day *</label>
          <input 
            id="targetMinutesPerDay"
            type="number"
            {...register('targetMinutesPerDay', { valueAsNumber: true })} 
            placeholder="30" 
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.targetMinutesPerDay && <p style={{ color: 'red', fontSize: '14px' }}>{errors.targetMinutesPerDay.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="startDate">Start Date *</label>
          <input 
            id="startDate"
            type="date"
            {...register('startDate')} 
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.startDate && <p style={{ color: 'red', fontSize: '14px' }}>{errors.startDate.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="endDate">End Date (Optional)</label>
          <input 
            id="endDate"
            type="date"
            {...register('endDate')} 
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.endDate && <p style={{ color: 'red', fontSize: '14px' }}>{errors.endDate.message}</p>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input 
            id="tags"
            {...register('tags', {
              setValueAs: (value: string) => value ? value.split(',').map(tag => tag.trim()) : []
            })} 
            placeholder="fitness, health, daily" 
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
          {errors.tags && <p style={{ color: 'red', fontSize: '14px' }}>{errors.tags.message}</p>}
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
            cursor: mutation.isPending ? 'not-allowed' : 'pointer'
          }}
        >
          {mutation.isPending ? 'Creating...' : 'Create Goal'}
        </button>

        {mutation.isError && (
          <p style={{ color: 'red', marginTop: '8px' }}>
            Error: {mutation.error?.message || 'Failed to create goal'}
          </p>
        )}

        {mutation.isSuccess && (
          <p style={{ color: 'green', marginTop: '8px' }}>
            Goal created successfully!
          </p>
        )}
      </form>
    </div>
  );
}

export default CreateGoal;