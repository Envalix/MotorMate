'use client';

import { useMe, clearToken } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const router = useRouter();

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Profile</h1>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white text-lg font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-zinc-900">{user?.name}</p>
              <p className="text-sm text-zinc-500">{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Sign out
      </button>
    </div>
  );
}
