import { Link, useNavigate } from 'react-router-dom';
import { useGoals, useDeleteGoal } from '../api/goals';
import { useAuth } from '../hooks/useAuth';

export default function GoalList() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data, isLoading, isError, error } = useGoals();
  const deleteMutation = useDeleteGoal();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h2>Goal List</h2>
        <p>Loading goals...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <h2>Goal List</h2>
        <p style={{ color: 'red' }}>
          Error loading goals: {error?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  const goals = data?.goals || [];
  const total = data?.total || 0;

  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(goalId);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>My Goals</h2>
          {user && (
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              {user.email}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link 
            to="/progress"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            Record Progress
          </Link>
          <Link 
            to="/new"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            + Create New Goal
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #ccc', borderRadius: '4px' }}>
          <p>No goals yet. Create your first goal to get started!</p>
          <Link 
            to="/new"
            style={{
              display: 'inline-block',
              marginTop: '16px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
          >
            Create Goal
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {goals.map((goal) => (
            <div
              key={goal.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{goal.title}</h3>
                  {goal.description && (
                    <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>
                      {goal.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#555' }}>
                    <span>
                      <strong>Target:</strong> {goal.targetMinutesPerDay} min/day
                    </span>
                    <span>
                      <strong>Start:</strong> {new Date(goal.startDate).toLocaleDateString()}
                    </span>
                    {goal.endDate && (
                      <span>
                        <strong>End:</strong> {new Date(goal.endDate).toLocaleDateString()}
                      </span>
                    )}
                    {goal.tags && goal.tags.length > 0 && (
                      <span>
                        <strong>Tags:</strong> {goal.tags.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  disabled={deleteMutation.isPending}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: deleteMutation.isPending ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleteMutation.isPending ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteMutation.isError && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          Error deleting goal: {deleteMutation.error?.message || 'Unknown error'}
        </div>
      )}
    </div>
  );
}


