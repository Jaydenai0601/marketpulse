'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import './nav.css';

const links = [
  { href: '/', label: '首页' },
  { href: '/daily', label: '日报详情' },
  { href: '/history', label: '历史回顾' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
        Market<span>Pulse</span>
      </Link>
      <button className="nav-menu-btn" onClick={() => setOpen(!open)} aria-label="菜单">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className={`nav-links ${open ? 'open' : ''}`}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link ${pathname === l.href ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
