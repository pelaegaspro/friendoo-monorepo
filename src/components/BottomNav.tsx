import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, Wallet, User } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/chats', label: 'Chats', Icon: MessageCircle },
  { to: '/wallet', label: 'Wallet', Icon: Wallet },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-[#0d0f1a]/95 backdrop-blur border-t border-white/[0.07] pb-safe h-16">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 transition-colors ${
              isActive ? 'text-[#7c5cff]' : 'text-white/40 hover:text-white/70'
            }`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
