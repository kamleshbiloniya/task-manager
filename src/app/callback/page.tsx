'use client';

import { useEffect, useState } from 'react';

export default function Callback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthentication() {
      try {
        // Extract JWT token from URL - this is what our backend redirects with
        const params = new URLSearchParams(window.location.search);
        const jwtToken = params.get('JwtToken');
        const error = params.get('error');

        if (error) {
          console.error('Authentication error from URL:', error);
          throw new Error(error);
        }

        if (!jwtToken) {
          throw new Error('No JWT token received from authentication');
        }

        console.log('Received JWT token from backend');
        
        try {
          // Parse the JWT payload to get user information
          const parts = jwtToken.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid JWT token format');
          }
          
          // Decode the JWT payload (second part)
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT payload:', payload);
          
          // Extract user information from the payload
          const username = payload.sub || 'User';
          const email = payload.sub; // Often the subject is the email for Google auth
          const roles = payload.roles || payload.scope?.split(' ').map((s: string) => s.toUpperCase()) || ['USER'];
          
          // Store authentication data in localStorage - EXACTLY like the username/password flow
          localStorage.setItem('accessToken', jwtToken);
          localStorage.setItem('tokenType', 'Bearer');
          localStorage.setItem('user', JSON.stringify({
            id: null, // ID might not be in the JWT
            username: username,
            email: email,
            roles: roles
          }));
          
          // Show success message (matching the username/password flow)
          setSuccess('Login successful! Redirecting to tasks page...');
          setLoading(false);
          console.log('Login successful');
          
          // Redirect to tasks page with delay - EXACTLY like the username/password flow
          setTimeout(() => {
            window.location.href = '/tasks';
          }, 1000);
          
        } catch (parseError) {
          console.error('Error parsing JWT:', parseError);
          throw new Error('Failed to parse authentication token');
        }
        
      } catch (err) {
        console.error('Error during authentication:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    }

    handleAuthentication();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Authentication</h1>
          <div className="w-16 h-1 bg-blue-600 mx-auto"></div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Completing authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}
