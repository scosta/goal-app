import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      // Error is handled by useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '400px', 
      margin: '50px auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Login</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            Email *
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            Password *
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            placeholder="••••••••"
          />
          {errors.password && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {authError && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            {authError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px' }}>
        <p style={{ marginBottom: '8px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#007bff' }}>Sign up</Link>
        </p>
        <Link to="/forgot-password" style={{ color: '#666', fontSize: '13px' }}>
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

