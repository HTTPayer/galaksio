'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Rocket, 
  Package, 
  Database, 
  Settings,
  ChevronRight
} from 'lucide-react';

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Project stats and activity'
  },
  {
    name: 'Compute',
    icon: Rocket,
    description: 'Deploy and manage apps',
    children: [
      { name: 'New Import', href: '/dashboard/compute/new' },
      { name: 'Deployments', href: '/dashboard/deployments' }
    ]
  },
  {
    name: 'Storage',
    href: '/dashboard/storage',
    icon: Database,
    description: 'Arweave permanent storage'
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

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/50 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/" className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-400" />
          <span className="font-bold text-lg">Galaksio</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              // Parent with children
              <div className="space-y-1">
                <div className="flex items-center px-3 py-2 text-sm font-medium text-slate-400">
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                </div>
                <div className="ml-8 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`
                        flex items-center px-3 py-2 text-sm rounded-md transition-colors
                        ${isActive(child.href)
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <ChevronRight className="mr-2 h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              // Single item
              <Link
                href={item.href!}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href!)
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <div>{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500">
          <div>Powered by x402</div>
          <div className="mt-1">Arweave • Akash • USDC</div>
        </div>
      </div>
    </aside>
  );
}
