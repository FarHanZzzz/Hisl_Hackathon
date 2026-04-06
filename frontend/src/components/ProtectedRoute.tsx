import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'clinician' | 'patient')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Quick mock of auth protection - assumes token exists and role is sufficient
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login'); // fallback to login if not authenticated
      return;
    }

    // In a real app we would decode JWT or do a ping to /api/v1/auth/me
    // Here we'll just parse the role if it's stored, or let it through for demo purposes
    const storedRole = localStorage.getItem('role') as 'admin' | 'clinician' | 'patient' | null;
    
    if (allowedRoles && allowedRoles.length > 0) {
      if (!storedRole || !allowedRoles.includes(storedRole)) {
        // Option to display unauth or redirect
        // For testing we will just allow it if no role is stored
        if (storedRole) {
           router.push('/unauthorized');
           return;
        }
      }
    }

    setIsAuthorized(true);
  }, [allowedRoles, router]);

  if (!isAuthorized) {
    return (
       <div className="min-h-screen bg-slate-950 flex items-center justify-center">
         <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
       </div>
    );
  }

  return <>{children}</>;
}
