'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if ((session.user as any)?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      // Ensure data is an array
      setUsers(Array.isArray(data) ? data : []);
      console.log('Fetched users:', data); // Debug log
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, isApproved: boolean) => {
    try {
      const res = await fetch('/api/auth/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved }),
      });
      
      if (res.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-white">User Management</h1>
      <div className="grid gap-4">
        {users.map((user: any) => (
          <div key={user._id} className="bg-white/10 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-white">{user.email}</p>
              <p className="text-sm text-gray-300">
                Status: {user.isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>
            <button
              onClick={() => handleApproval(user._id, !user.isApproved)}
              className={`px-4 py-2 rounded ${
                user.isApproved 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {user.isApproved ? 'Revoke' : 'Approve'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}