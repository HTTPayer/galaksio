'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Rocket, 
  Package, 
  Database, 
  Settings,
  ChevronRight,
  ChevronDown,
  Wallet,
  Loader2
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Project stats and activity'
  },
  {
    name: 'Deployments',
    icon: Rocket,
    description: 'Deploy and manage jobs',
    children: [
      { name: 'New Deployment', href: '/dashboard/compute/new' },
      { name: 'All Jobs', href: '/dashboard/deployments' }
    ]
  },
  {
    name: 'Storage',
    icon: Database,
    description: 'Permanent storage',
    children: [
      { name: 'New Storage', href: '/dashboard/storage' },
      { name: 'All Stored Files', href: '/dashboard/storage/files' }
    ]
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account and preferences'
  }
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { walletAddress, connectWallet, disconnectWallet, isConnecting } = useWallet();
  const [expandedSections, setExpandedSections] = useState<string[]>(['Deployments', 'Storage']);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (name: string) => {
    setExpandedSections(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col h-screen">
      {/* Wallet Section */}
      <div className="p-4 border-b border-zinc-200">
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500 uppercase font-semibold">Wallet</Label>
          {walletAddress ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono text-zinc-700 flex-1">
                  {formatAddress(walletAddress)}
                </span>
              </div>
              <Button
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-blue-950 hover:bg-blue-900 text-white"
              size="sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-3 w-3" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              // Parent with children - Collapsible
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection(item.name)}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {expandedSections.includes(item.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedSections.includes(item.name) && (
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`
                          flex items-center px-3 py-2 text-sm rounded-md transition-colors
                          ${isActive(child.href)
                            ? 'bg-blue-950/5 text-blue-950 font-medium'
                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                          }
                        `}
                      >
                        <ChevronRight className="mr-2 h-4 w-4" />
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Single item
              <Link
                href={item.href!}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href!)
                    ? 'bg-blue-950/5 text-blue-950'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <div>{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
