'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthResponse {
  id: number | null;
  username: string;
  email: string;
  roles: string[];
  accessToken: string;
  tokenType: string;
}

export default function GoogleCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthData() {
      try {
        // Extract code and state if present in URL for debugging
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          console.error('Google auth error from URL:', error);
          throw new Error(error);
        }

        if (!code) {
          console.warn('No code in callback URL - trying direct endpoint');
        }
        
        // Call the backend OAuth callback endpoint directly
        const response = await fetch('http://127.0.0.1:8080/oauth2/callback/google', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
        });

        if (!response.ok) {
          throw new Error(`Authentication failed with status: ${response.status}`);
        }

        // Parse the authentication response
        const authData: AuthResponse = await response.json();
        console.log('Authentication successful:', authData);
        
        // Store the authentication data in localStorage
        localStorage.setItem('accessToken', authData.accessToken);
        localStorage.setItem('tokenType', authData.tokenType);
        localStorage.setItem('user', JSON.stringify({
          id: authData.id,
          username: authData.username,
          email: authData.email,
          roles: authData.roles
        }));
        
        // Redirect to tasks page with success message
        window.location.href = 'http://127.0.0.1:3000/tasks';
      } catch (err) {
        console.error('Error during authentication:', err);
        localStorage.setItem('authError', err instanceof Error ? err.message : 'Authentication failed');
        setError(err instanceof Error ? err.message : 'Authentication failed');
        window.location.href = 'http://127.0.0.1:3000/';
      } finally {
        setLoading(false);
      }
    }

    fetchAuthData();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        {loading ? (
          <>
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-xl">Completing authentication...</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-xl mb-4">Authentication Error</div>
            <p className="text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-xl mb-4">Authentication Successful!</div>
            <p className="text-gray-600">Redirecting to your tasks...</p>
          </>
        )}
      </div>
    </div>
  );
}
