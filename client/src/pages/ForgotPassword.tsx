import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { resetPassword, error: authError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setSuccess(false);
    try {
      await resetPassword(data.email);
      setSuccess(true);
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
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Reset Password</h2>
      
      {success ? (
        <div>
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            borderRadius: '4px',
            fontSize: '14px',
          }}>
            Password reset email sent! Check your inbox for instructions.
          </div>
          <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
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
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '14px' }}>
            <Link to="/login" style={{ color: '#007bff' }}>← Back to Login</Link>
          </div>
        </>
      )}
    </div>
  );
}

