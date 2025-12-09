'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { Loader2, User, Key, Bell, Shield } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('github');
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-950" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white">
      <div className="px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Settings</h1>
          <p className="mt-1 text-zinc-600">
            Manage your account preferences and security
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-blue-950" />
              <h2 className="text-xl font-bold text-zinc-900">Profile</h2>
            </div>
            
            <div className="flex items-center gap-4">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium text-zinc-900">
                  {session.user?.name}
                </p>
                <p className="text-sm text-zinc-600">
                  {session.user?.email}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Connected via GitHub
                </p>
              </div>
            </div>
          </div>

          {/* API Keys (Placeholder) */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-blue-950" />
              <h2 className="text-xl font-bold text-zinc-900">API Keys</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Manage API keys for programmatic access to Galaksio
            </p>
            <button className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-900">
              Generate API Key
            </button>
          </div>

          {/* Notifications (Placeholder) */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-blue-950" />
              <h2 className="text-xl font-bold text-zinc-900">Notifications</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-zinc-700">
                  Deployment status updates
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-zinc-700">
                  Build failures
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-zinc-700">
                  Weekly reports
                </span>
              </label>
            </div>
          </div>

          {/* Security (Placeholder) */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-blue-950" />
              <h2 className="text-xl font-bold text-zinc-900">Security</h2>
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              Your account is secured through GitHub OAuth
            </p>
            <div className="space-y-2 text-sm text-zinc-700">
              <p>✓ Two-factor authentication enabled (via GitHub)</p>
              <p>✓ Secure session management</p>
              <p>✓ Encrypted data transfer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
