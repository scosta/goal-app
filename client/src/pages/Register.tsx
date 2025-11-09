import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  displayName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.displayName);
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
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Create Account</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="displayName" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            Display Name (Optional)
          </label>
          <input
            id="displayName"
            type="text"
            {...register('displayName')}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
            placeholder="Your Name"
          />
        </div>

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

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
            Confirm Password *
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
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
          {errors.confirmPassword && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.confirmPassword.message}
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
            backgroundColor: isLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px' }}>
        <p>
          Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

