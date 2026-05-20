import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const handleLogout = () => signOut(auth);

  const navItems = [
    { icon: Home, path: '/', label: 'Discover' },
    { icon: UserPlus, path: '/requests', label: 'Requests' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-card border-r p-6">
        <div className="text-2xl font-black italic text-primary mb-12">FRIENDOO</div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                className="w-full justify-start gap-4 h-12 rounded-xl"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t mt-auto">
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-4 rounded-xl text-destructive hover:text-destructive">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-4 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center">
              <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
