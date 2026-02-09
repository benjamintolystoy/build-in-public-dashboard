'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: '◈' },
  { href: '/journal', label: 'Journal', icon: '✎' },
  { href: '/tweets', label: 'Tweets', icon: '✦' },
  { href: '/engagement', label: 'Engagement', icon: '⚡' },
  { href: '/influencers', label: 'Influencers', icon: '◉' },
  { href: '/promoted', label: 'Promoted', icon: '▲' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#0f1320] border-r border-[#1e293b] flex flex-col z-50">
      <div className="p-5 border-b border-[#1e293b]">
        <h1 className="text-lg font-bold text-white tracking-tight">Build In Public</h1>
        <p className="text-xs text-gray-500 mt-0.5">Agent Dashboard</p>
      </div>
      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active
                  ? 'text-white bg-[#1e293b] border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-[#111827]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-[#1e293b]">
        <p className="text-xs text-gray-600">@benchiche</p>
      </div>
    </aside>
  );
}
