'use client';
import { signIn } from 'next-auth/react';

export default function LoginButton() {
  return (
    <button 
      onClick={() => signIn('google')}
      className="w-full flex items-center justify-center space-x-2 bg-green-50 text-gray-700 border border-green-100 font-medium py-3 rounded-lg hover:bg-green-100 transition-colors"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
      <span>Login with Google</span>
    </button>
  );
}
