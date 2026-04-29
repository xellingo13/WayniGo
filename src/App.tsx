import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Home, 
  Car, 
  User as UserIcon, 
  MapPin, 
  Phone, 
  Plus, 
  Minus,
  PackageOpen,
  Check,
  Search, 
  Navigation, 
  Clock, 
  Users, 
  ChevronRight,
  LogOut,
  MessageSquare,
  ArrowRightLeft,
  FileText,
  Newspaper,
  Trash2,
  ArrowRight,
  RotateCcw,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DISTRICTS, User, Ride, RideRequest } from './types';
import { translations, LanguageCode } from './translations';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const socket: Socket = io();

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('taxi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'home' | 'post' | 'profile' | 'my-ads' | 'news'>('home');
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [searchDate, setSearchDate] = useState('today');
  const [activeTab, setActiveTab] = useState<'rides' | 'requests'>('rides');
  const [lang, setLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem('taxi_lang') as LanguageCode) || 'uz';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('taxi_lang', lang);
  }, [lang]);

  useEffect(() => {
    fetch('/api/rides').then(res => res.json()).then(setRides);
    fetch('/api/rides').then(res => res.json()).then(setRides);
    fetch('/api/requests').then(res => res.json()).then(setRequests);

    socket.on('new_ride', (ride: Ride) => {
      setRides(prev => [ride, ...prev]);
    });

    socket.on('ride_updated', (updatedRide: Ride) => {
      setRides(prev => prev.map(r => r.id === updatedRide.id ? updatedRide : r));
    });

    socket.on('ride_permanently_deleted', (rideId: string) => {
      setRides(prev => prev.filter(r => r.id !== rideId));
    });

    socket.on('new_request', (req: RideRequest) => {
      setRequests(prev => [req, ...prev]);
    });

    socket.on('request_updated', (updatedReq: RideRequest) => {
      setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    });

    socket.on('request_permanently_deleted', (reqId: string) => {
      setRequests(prev => prev.filter(r => r.id !== reqId));
    });

    return () => {
      socket.off('new_ride');
      socket.off('ride_updated');
      socket.off('ride_permanently_deleted');
      socket.off('new_request');
      socket.off('request_updated');
      socket.off('request_permanently_deleted');
    };
  }, []);

  const handleLogin = async (userData: User) => {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    setUser(userData);
    localStorage.setItem('taxi_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taxi_user');
  };

  const filteredRides = useMemo(() => {
    return rides.filter(r => 
      (!searchFrom || r.from_loc === searchFrom) && 
      (!searchTo || r.to_loc === searchTo) &&
      ((r.departure_date || 'today') === searchDate)
    );
  }, [rides, searchFrom, searchTo, searchDate]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => 
      (!searchFrom || r.from_loc === searchFrom) && 
      (!searchTo || r.to_loc === searchTo) &&
      ((r.departure_date || 'today') === searchDate)
    );
  }, [requests, searchFrom, searchTo, searchDate]);

  if (!user) {
    return <Login onLogin={handleLogin} t={t} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-sans pb-24 transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-black/5 px-4 py-3 transition-colors">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#FFD700] rounded-[0.9rem] flex items-center justify-center text-[#1A1A1A] shadow-xl shadow-[#FFD700]/20">
              <Navigation size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-base tracking-tighter leading-none">{t.appName}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* User Role Switcher - simplified */}
            <div className="bg-black/5 p-0.5 rounded-xl items-center hidden sm:flex transition-colors">
                <button 
                  onClick={() => setUser({...user, role: 'passenger'})}
                  className={cn(
                    "px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                    user.role === 'passenger' ? "bg-white text-[#0092B3] shadow-sm" : "text-black/30"
                  )}
                >
                  {t.passenger}
                </button>
                <button 
                  onClick={() => setUser({...user, role: 'driver'})}
                  className={cn(
                    "px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all",
                    user.role === 'driver' ? "bg-white text-[#FFD700] shadow-sm" : "text-black/30"
                  )}
                >
                  {t.driver}
                </button>
            </div>

            <button 
              onClick={() => setView('profile')}
              className={cn(
                "w-10 h-10 rounded-[1.1rem] flex items-center justify-center transition-all relative group border",
                view === 'profile' 
                  ? "bg-black border-black text-white shadow-xl shadow-black/20" 
                  : "bg-white border-black/5 text-black/40 hover:bg-black/5"
              )}
            >
              {user.role === 'driver' ? <Car size={18} /> : <UserIcon size={18} />}
              {view === 'profile' && (
                <motion.div 
                   layoutId="profile-dot"
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#FFD700] border-2 border-white rounded-full shadow-sm"
                />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {view === 'home' && (
          <div className="space-y-4">
            {/* Search Section */}
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-black/5 space-y-4 transition-colors">
              <div className="grid grid-cols-1 gap-2.5">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0092B3]" size={16} />
                  <select 
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                    className="w-full bg-black/5 border-none rounded-xl py-3.5 pl-11 pr-11 focus:ring-2 focus:ring-[#0092B3] appearance-none text-xs font-bold transition-colors"
                  >
                    <option value="">{t.whereFrom} ({t.all})</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex justify-center -my-2 relative z-10">
                  <button 
                    onClick={() => {
                      const temp = searchFrom;
                      setSearchFrom(searchTo);
                      setSearchTo(temp);
                    }}
                    className="bg-white p-1.5 rounded-full shadow-md border border-black/5 hover:scale-110 transition-all"
                  >
                    <ArrowRightLeft size={14} className="rotate-90 text-[#0092B3]" />
                  </button>
                </div>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]" size={16} />
                  <select 
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full bg-black/5 border-none rounded-xl py-3.5 pl-11 pr-11 focus:ring-2 focus:ring-[#FFD700] appearance-none text-xs font-bold transition-colors"
                  >
                    <option value="">{t.whereTo} ({t.all})</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Date Filter */}
              <div className="flex bg-black/5 p-1 rounded-xl h-10 transition-colors">
                <button 
                  onClick={() => setSearchDate('today')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    searchDate === 'today' ? "bg-white text-black shadow-sm" : "text-black/30"
                  )}
                >
                  {t.today}
                </button>
                <button 
                  onClick={() => setSearchDate('tomorrow')}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    searchDate === 'tomorrow' ? "bg-white text-black shadow-sm" : "text-black/30"
                  )}
                >
                  {t.tomorrow}
                </button>
              </div>
            </section>

            {/* All Listings Section */}
            <div className="space-y-8">
              {user.role === 'passenger' ? (
                /* Passenger sees Drivers */
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#B8860B]">{t.driversAds}</h2>
                    <div className="h-px flex-1 mx-4 bg-[#FFD700]/10" />
                  </div>
                  <AnimatePresence mode="popLayout">
                    {filteredRides.length > 0 ? (
                      filteredRides.map((ride) => (
                        <RideCard key={ride.id} ride={ride} t={t} />
                      ))
                    ) : (
                      <EmptyState message={t.noDrivers} t={t} />
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Driver sees Passengers */
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#0092B3]">{t.passengersRequests}</h2>
                    <div className="h-px flex-1 mx-4 bg-[#0092B3]/10" />
                  </div>
                  <AnimatePresence mode="popLayout">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((req) => (
                        <RequestCard key={req.id} request={req} t={t} />
                      ))
                    ) : (
                      <EmptyState message={t.noPassengers} t={t} />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'post' && (
          <PostForm 
            user={user} 
            onClose={() => setView('home')} 
            t={t}
          />
        )}

        {view === 'profile' && (
          <Profile 
            user={user} 
            onLogout={handleLogout} 
            onClose={() => setView('home')} 
            onUpdate={handleLogin}
            t={t}
            lang={lang}
            setLang={setLang}
          />
        )}

        {view === 'my-ads' && (
          <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center px-2">
              <h2 className={cn(
                "text-xl font-black tracking-tight uppercase tracking-widest",
                user.role === 'driver' ? "text-[#B8860B]" : "text-[#0092B3]"
              )}>{t.myAds}</h2>
            </div>
            
            <div className="space-y-8">
              {/* Active Ads */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{t.activeAds}</span>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {user.role === 'driver' ? (
                    rides.filter(r => r.driver_id === user.id && r.status === 'active').length > 0 ? (
                      rides.filter(r => r.driver_id === user.id && r.status === 'active').map(ride => (
                        <MyRideCard key={ride.id} ride={ride} socket={socket} t={t} />
                      ))
                    ) : (
                      <EmptyState message={t.noActiveAds} t={t} />
                    )
                  ) : (
                    requests.filter(req => req.passenger_id === user.id && req.status === 'active').length > 0 ? (
                      requests.filter(req => req.passenger_id === user.id && req.status === 'active').map(req => (
                        <MyRequestCard key={req.id} req={req} socket={socket} t={t} />
                      ))
                    ) : (
                      <EmptyState message={t.noActiveRequests} t={t} />
                    )
                  )}
                </AnimatePresence>
              </div>

              {/* History Ads */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{t.historyAds}</span>
                </div>
                
                <div className="opacity-60">
                  <AnimatePresence mode="popLayout">
                    {user.role === 'driver' ? (
                      rides.filter(r => r.driver_id === user.id && r.status === 'deleted').length > 0 ? (
                        rides.filter(r => r.driver_id === user.id && r.status === 'deleted').map(ride => (
                          <MyRideCard key={ride.id} ride={ride} socket={socket} t={t} />
                        ))
                      ) : (
                        <div className="bg-black/5 p-8 rounded-[2.5rem] border border-dashed border-black/10 flex flex-col items-center justify-center text-center transition-colors">
                          <Clock size={32} className="text-black/10 mb-2" />
                          <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">{t.noHistory}</p>
                        </div>
                      )
                    ) : (
                      requests.filter(req => req.passenger_id === user.id && req.status === 'deleted').length > 0 ? (
                        requests.filter(req => req.passenger_id === user.id && req.status === 'deleted').map(req => (
                          <MyRequestCard key={req.id} req={req} socket={socket} t={t} />
                        ))
                      ) : (
                        <div className="bg-black/5 p-8 rounded-[2.5rem] border border-dashed border-black/10 flex flex-col items-center justify-center text-center transition-colors">
                          <Clock size={32} className="text-black/10 mb-2" />
                          <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">{t.noHistory}</p>
                        </div>
                      )
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'news' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="w-24 h-24 rounded-[2.5rem] bg-[#0092B3]/5 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-[#0092B3]/10 rounded-full blur-2xl animate-pulse" />
              <Newspaper size={48} className="text-[#0092B3]/20 relative z-10" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase tracking-widest text-[#0092B3]">{t.soon}</h2>
            <p className="text-sm font-bold text-black/30 max-w-[200px] leading-relaxed uppercase">{t.newsWorking}</p>
            <div className="mt-8 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#0092B3]" 
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="max-w-md mx-auto relative">
          <nav className="bg-white/70 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] shadow-2xl px-6 py-2 flex items-center justify-between relative overflow-visible h-14 transition-colors">
            <NavButton 
              active={view === 'home'} 
              onClick={() => setView('home')} 
              icon={<Home size={22} />} 
              label={t.navHome}
            />
            
            {/* Central Floating Action Button */}
            <div className="relative -top-1 translate-y-[-1.5rem]">
              <button 
                onClick={() => setView('post')}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 border-4 border-white group relative overflow-hidden",
                  view === 'post' 
                    ? "bg-black text-white" 
                    : (user.role === 'driver' ? "bg-[#FFD700] text-[#1A1A1A]" : "bg-[#0092B3] text-white")
                )}
              >
                <Plus size={32} className={cn("transition-transform duration-300", view === 'post' ? "rotate-45" : "group-hover:scale-110")} />
              </button>
            </div>

            <NavButton 
              active={view === 'my-ads'} 
              onClick={() => setView('my-ads')} 
              icon={<FileText size={22} />} 
              label={t.navMyAds}
            />
          </nav>
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all py-1 px-4 rounded-3xl relative min-w-[70px]",
        active ? "text-white" : "text-black/15 hover:text-black/30"
      )}
    >
      {active && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-0 bg-[#0092B3] rounded-2xl z-0 shadow-lg shadow-[#0092B3]/20"
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={active ? { scale: 1.1 } : { scale: 1 }}
        >
          {icon}
        </motion.div>
        <span className={cn(
          "text-[7px] font-black uppercase tracking-widest transition-all",
          active ? "opacity-100 mt-0.5" : "opacity-0 absolute -bottom-4"
        )}>
          {label}
        </span>
      </div>
    </button>
  );
}

function Login({ onLogin, t, lang, setLang }: { onLogin: (u: User) => void, t: any, lang: LanguageCode, setLang: (l: LanguageCode) => void }) {
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carNumber, setCarNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name,
      phone,
      role,
      car_model: role === 'driver' ? carModel : undefined,
      car_number: role === 'driver' ? carNumber : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-[#1A1A1A] transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-1.5">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center text-[#FFD700] shadow-2xl mb-4 border border-black/5">
            <Navigation size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">{t.appName}</h1>
          
          <div className="flex justify-center gap-2 pt-2">
            {(['qq', 'uz', 'ru'] as LanguageCode[]).map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                  lang === l ? "bg-[#0092B3] text-white border-transparent" : "text-white/40 border-white/20"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-6 space-y-5 text-[#1A1A1A] shadow-2xl border border-black/5 transition-colors">
          <div className="flex bg-black/5 p-1 rounded-xl">
            <button 
              type="button"
              onClick={() => setRole('passenger')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                role === 'passenger' ? "bg-white shadow-sm text-[#0092B3]" : "text-black/40"
              )}
            >
              {t.passenger}
            </button>
            <button 
              type="button"
              onClick={() => setRole('driver')}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "text-black/40"
              )}
            >
              {t.driver}
            </button>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.nameLabel}</label>
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className={cn(
                  "w-full bg-black/5 border-none rounded-xl py-3.5 px-5 transition-all focus:ring-2 placeholder:text-black/10 text-sm",
                  role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                )}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.phoneLabel}</label>
              <input 
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className={cn(
                  "w-full bg-black/5 border-none rounded-xl py-3.5 px-5 transition-all focus:ring-2 placeholder:text-black/10 text-sm",
                  role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                )}
              />
            </div>

            {role === 'driver' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.carModelLabel}</label>
                  <input 
                    required
                    value={carModel}
                    onChange={e => setCarModel(e.target.value)}
                    placeholder={t.placeholderCar}
                    className={cn(
                      "w-full bg-black/5 border-none rounded-xl py-3.5 px-5 transition-all focus:ring-2 placeholder:text-black/10 text-sm focus:ring-[#FFD700]"
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.carNumberLabel}</label>
                  <input 
                    required
                    value={carNumber}
                    onChange={e => setCarNumber(e.target.value)}
                    placeholder={t.placeholderNumber}
                    className={cn(
                      "w-full bg-black/5 border-none rounded-xl py-3.5 px-5 transition-all focus:ring-2 placeholder:text-black/10 text-sm focus:ring-[#FFD700]"
                    )}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <button 
            type="submit"
            className={cn(
              "w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all mt-4",
              role === 'driver' ? "bg-[#FFD700] text-[#1A1A1A] shadow-[#FFD700]/20" : "bg-[#0092B3] text-white shadow-[#0092B3]/20"
            )}
          >
            {t.login}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function RideCard({ ride, t }: { ride: Ride; t: any; key?: string }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-2.5 shadow-md border border-black/5 active:scale-[0.99] transition-all"
    >
      <div className="flex items-stretch gap-3 h-16">
        {/* Left: Driver */}
        <div className="flex-[4] min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#FFD700]/10 rounded-lg flex items-center justify-center text-[#B8860B] shrink-0">
              <Car size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight mb-0.5 truncate">{ride.driver_name}</h3>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <p className="text-[9px] text-black/40 font-bold uppercase truncate">{ride.car_model}</p>
                {ride.car_number && (
                  <>
                    <div className="w-0.5 h-0.5 rounded-full bg-black/10 shrink-0" />
                    <p className="text-[8px] text-black/40 font-black tracking-widest bg-black/5 px-1 py-0.5 rounded whitespace-nowrap">
                      {ride.car_number}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Seats */}
        <div className="flex-[1.2] border-x border-black/5 px-1.5 flex flex-col justify-center items-center text-center">
          <div className="flex items-center gap-1 text-[#B8860B]">
            <Users size={14} />
            <span className="text-xs font-black">{ride.seats}</span>
          </div>
          {Boolean(ride.has_delivery) ? (
            <div className="flex items-center gap-0.5 text-[#B8860B]/60 mt-0.5">
              <PackageOpen size={9} />
              <span className="text-[6px] font-black uppercase leading-none">{t.deliveryMin}</span>
            </div>
          ) : (
            <div className="text-[8px] font-bold text-black/20 uppercase">{t.seatMin}</div>
          )}
        </div>

        {/* Right: Time and Action */}
        <div className="flex-[2.8] flex flex-col justify-between items-end">
          <div className="flex flex-col items-end gap-1">
            {ride.departure_date === 'tomorrow' && (
              <span className="text-[8px] font-black text-[#B8860B] uppercase tracking-tighter bg-[#FFD700]/10 px-1.5 py-0.5 rounded leading-none">{t.tomorrowMin}</span>
            )}
            <div className="flex items-center gap-1 text-black/60 bg-black/5 px-1.5 py-0.5 rounded-md transition-colors">
              <Clock size={12} className="text-[#B8860B]" />
              <span className="text-[10px] font-bold whitespace-nowrap">{ride.departure_time}</span>
            </div>
          </div>
          
          <a 
            href={`tel:${ride.driver_phone}`}
            className="bg-[#FFD700] text-[#1A1A1A] w-full py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#FFD700]/10 active:scale-95 transition-transform"
          >
            <Phone size={12} />
            TEL
          </a>
        </div>
      </div>
      {ride.note && (
        <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-start gap-2">
          <div className="text-[8px] bg-black/5 px-1.5 py-0.5 rounded font-bold text-black/40 uppercase shrink-0">{t.noteMin}</div>
          <p className="text-[9px] font-medium text-black/50 leading-tight truncate">{ride.note}</p>
        </div>
      )}
    </motion.div>
  );
}

function RequestCard({ request, t }: { request: RideRequest; t: any; key?: string }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-2.5 shadow-md border border-black/5 active:scale-[0.99] transition-all"
    >
      <div className="flex items-stretch gap-3 h-16">
        {/* Left: Passenger */}
        <div className="flex-[4] min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#0092B3]/10 rounded-lg flex items-center justify-center text-[#0092B3] shrink-0">
              <UserIcon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{request.passenger_name}</h3>
            </div>
          </div>
        </div>

        {/* Middle: Seats */}
        <div className="flex-[1.2] border-x border-black/5 px-1.5 flex flex-col justify-center items-center text-center">
          <div className="flex items-center gap-1 text-[#0092B3]">
            <Users size={14} />
            <span className="text-xs font-black">{request.seats}</span>
          </div>
          <div className="text-[8px] font-bold text-black/20 uppercase mt-0.5">{t.peopleMin}</div>
        </div>

        {/* Right: Time and Action */}
        <div className="flex-[2.8] flex flex-col justify-between items-end">
          <div className="flex flex-col items-end gap-1">
            {request.departure_date === 'tomorrow' && (
              <span className="text-[8px] font-black text-[#0092B3] uppercase tracking-tighter bg-[#0092B3]/10 px-1.5 py-0.5 rounded leading-none">{t.tomorrowMin}</span>
            )}
            <div className="flex items-center gap-1 text-black/60 bg-black/5 px-1.5 py-0.5 rounded-md transition-colors">
              <Clock size={12} className="text-[#0092B3]" />
              <span className="text-[10px] font-bold whitespace-nowrap">{request.departure_time || t.now}</span>
            </div>
          </div>
          
          <a 
            href={`tel:${request.passenger_phone}`}
            className="bg-[#0092B3] text-white w-full py-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 shadow-lg shadow-[#0092B3]/10 active:scale-95 transition-transform"
          >
            <Phone size={12} />
            TEL
          </a>
        </div>
      </div>
      {request.note && (
        <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-start gap-2">
          <div className="text-[8px] bg-black/5 px-1.5 py-0.5 rounded font-bold text-black/40 uppercase shrink-0">{t.noteMin}</div>
          <p className="text-[9px] font-medium text-black/50 leading-tight truncate">{request.note}</p>
        </div>
      )}
    </motion.div>
  );
}


function PostForm({ user, onClose, t }: { user: User, onClose: () => void, t: any }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [price, setPrice] = useState('');
  const [vehicleType, setVehicleType] = useState<'standard' | 'large'>('standard');
  const [seats, setSeats] = useState(user.role === 'driver' ? 4 : 1);
  const [dateType, setDateType] = useState('today'); // 'today' or 'tomorrow'
  const [hasDelivery, setHasDelivery] = useState(false);
  const [note, setNote] = useState('');
  const [timeType, setTimeType] = useState<'now' | 'fixed' | 'range'>('now');
  const [fixedTime, setFixedTime] = useState('10:00');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`last_ad_${user.role}`);
    if (saved) setHasHistory(true);
  }, [user.role]);

  const handleFillLast = () => {
    const saved = localStorage.getItem(`last_ad_${user.role}`);
    if (saved) {
      const data = JSON.parse(saved);
      setFrom(data.from_loc || '');
      setTo(data.to_loc || '');
      setSeats(data.seats || (user.role === 'driver' ? 4 : 1));
      setNote(data.note || '');
      setHasDelivery(!!data.has_delivery);
      if (user.role === 'driver' && data.vehicleType) {
        setVehicleType(data.vehicleType);
      }
    }
  };

  // Adjust seats based on role and vehicle type
  useEffect(() => {
    if (user.role === 'driver') {
      const max = vehicleType === 'standard' ? 4 : 10;
      setSeats(max); 
    } else {
      setSeats(1);
    }
  }, [vehicleType, user.role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;

    let finalTime = '';
    if (timeType === 'now') {
      finalTime = 'Hozir';
    } else if (timeType === 'fixed') {
      finalTime = fixedTime;
    } else {
      finalTime = `${startTime} - ${endTime}`;
    }

    if (user.role === 'driver') {
      const payload = {
        id: Math.random().toString(36).substr(2, 9),
        driver_id: user.id,
        from_loc: from,
        to_loc: to,
        price: parseInt(price) || 0,
        seats: seats,
        departure_time: finalTime,
        departure_date: dateType,
        has_delivery: hasDelivery,
        note: note,
      };
      socket.emit('post_ride', payload);
      // Save for next time
      localStorage.setItem(`last_ad_driver`, JSON.stringify({
        from_loc: from,
        to_loc: to,
        seats: seats,
        note: note,
        has_delivery: hasDelivery,
        vehicleType: vehicleType
      }));
    } else {
      const payload = {
        id: Math.random().toString(36).substr(2, 9),
        passenger_id: user.id,
        from_loc: from,
        to_loc: to,
        seats: seats,
        departure_time: finalTime,
        departure_date: dateType,
        has_delivery: hasDelivery,
        note: note,
      };
      socket.emit('post_request', payload);
      // Save for next time
      localStorage.setItem(`last_ad_passenger`, JSON.stringify({
        from_loc: from,
        to_loc: to,
        seats: seats,
        note: note,
        has_delivery: hasDelivery
      }));
    }
    onClose();
  };

  const maxSeats = user.role === 'passenger' ? 10 : (vehicleType === 'standard' ? 4 : 10);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black tracking-tight">{t.postTitle}</h2>
          {hasHistory && (
            <button 
              onClick={handleFillLast}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95",
                user.role === 'driver' 
                  ? "bg-[#FFD700]/10 border-[#FFD700]/20 text-[#B8860B]" 
                  : "bg-[#0092B3]/10 border-[#0092B3]/20 text-[#0092B3]"
              )}
            >
              <RotateCcw size={8} />
              {t.repeat}
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-black/30 font-bold text-xs">{t.cancel}</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-5 space-y-5 shadow-sm border border-black/5 transition-colors">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.fromLabel}</label>
                <select 
                  required
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className={cn(
                    "w-full bg-black/5 border-none rounded-xl py-2.5 px-5 text-xs font-bold focus:ring-2 transition-colors",
                    user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                  )}
                >
                  <option value="">{t.selectDistrict}</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.toLabel}</label>
                <select 
                  required
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className={cn(
                    "w-full bg-black/5 border-none rounded-xl py-2.5 px-5 text-xs font-bold focus:ring-2 transition-colors",
                    user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                  )}
                >
                  <option value="">{t.selectDistrict}</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-1">{t.dateLabel}</label>
              <div className="flex bg-black/5 p-1 rounded-xl h-10 transition-colors">
                <button 
                  type="button"
                  onClick={() => setDateType('today')}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-bold transition-all",
                    dateType === 'today' 
                      ? (user.role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "bg-white shadow-sm text-[#0092B3]") 
                      : "text-black/40"
                  )}
                >
                  {t.today}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setDateType('tomorrow');
                    if (timeType === 'now') setTimeType('fixed');
                  }}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-bold transition-all",
                    dateType === 'tomorrow' 
                      ? (user.role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "bg-white shadow-sm text-[#0092B3]") 
                      : "text-black/40"
                  )}
                >
                  {t.tomorrow}
                </button>
              </div>
            </div>

            {user.role === 'driver' && (
              <div className="space-y-2.5 text-center">
                <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">{t.vehicleTypeLabel}</label>
                <div className="flex bg-black/5 p-1 rounded-xl transition-colors">
                  <button 
                    type="button"
                    onClick={() => setVehicleType('standard')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      vehicleType === 'standard' ? "bg-white shadow-sm text-[#FFD700]" : "text-black/40"
                    )}
                  >
                    <Car size={10} className="inline mr-1" />
                    {t.standardVehicle}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setVehicleType('large')}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      vehicleType === 'large' ? "bg-white shadow-sm text-[#FFD700]" : "text-black/40"
                    )}
                  >
                    <Users size={10} className="inline mr-1" />
                    {t.largeVehicle}
                  </button>
                </div>
              </div>
            )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-3">
              {user.role === 'driver' ? t.emptySeatsLabel : t.passengerCountLabel}
            </label>
            <div className="flex items-center justify-between bg-black/5 rounded-xl p-1 h-12 transition-colors">
              <button 
                type="button"
                onClick={() => setSeats(prev => Math.max(1, prev - 1))}
                className={cn(
                  "w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all disabled:opacity-30",
                  user.role === 'driver' ? "text-[#FFD700]" : "text-[#0092B3]"
                )}
                disabled={seats <= 1}
              >
                <Minus size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base font-black leading-none">{seats}</span>
                <span className="text-[8px] font-bold text-black/30 uppercase tracking-widest">
                  {user.role === 'driver' ? t.seatsLabel : t.peopleLabel}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setSeats(prev => Math.min(maxSeats, prev + 1))}
                className={cn(
                  "w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center active:scale-95 transition-all disabled:opacity-30",
                  user.role === 'driver' ? "text-[#FFD700]" : "text-[#0092B3]"
                )}
                disabled={seats >= maxSeats}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {user.role === 'driver' && (
              <button 
                type="button"
                onClick={() => setHasDelivery(!hasDelivery)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                  hasDelivery 
                    ? (user.role === 'driver' ? "bg-[#FFD700]/5 border-[#FFD700] text-[#B8860B]" : "bg-[#0092B3]/5 border-[#0092B3] text-[#0092B3]")
                    : "bg-black/5 border-transparent text-black/30"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    hasDelivery 
                      ? (user.role === 'driver' ? "bg-[#FFD700]/10" : "bg-[#0092B3]/10")
                      : "bg-black/5"
                  )}>
                    <PackageOpen size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black leading-none mb-0.5">{t.deliveryLabel}</p>
                    <p className="text-[8px] font-medium opacity-50 uppercase">{hasDelivery ? t.deliveryYes : t.deliveryNo}</p>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  hasDelivery 
                    ? (user.role === 'driver' ? "bg-[#FFD700] border-[#FFD700]" : "bg-[#0092B3] border-[#0092B3]")
                    : "border-black/10"
                )}>
                  {hasDelivery && <Check size={12} className={cn(user.role === 'driver' ? "text-[#1A1A1A]" : "text-white")} />}
                </div>
              </button>
            )}
            <div className="px-1">
              <input 
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={60}
                placeholder={user.role === 'driver' ? t.placeholderNoteDriver : t.placeholderNotePassenger}
                className="w-full bg-black/5 border-none rounded-xl py-3 px-4 text-[10px] font-bold focus:ring-2 focus:ring-[#0092B3] placeholder:text-black/20 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-black/40 ml-1">{t.timeLabel}</label>
            <div className="flex bg-black/5 p-1 rounded-xl h-10 transition-colors">
              {dateType === 'today' && (
                <button 
                  type="button"
                  onClick={() => setTimeType('now')}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-bold transition-all",
                    timeType === 'now' 
                      ? (user.role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "bg-white shadow-sm text-[#0092B3]") 
                      : "text-black/40"
                  )}
                >
                  {t.now}
                </button>
              )}
              <button 
                type="button"
                onClick={() => setTimeType('fixed')}
                className={cn(
                  "flex-1 rounded-lg text-[10px] font-bold transition-all",
                  timeType === 'fixed' 
                    ? (user.role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "bg-white shadow-sm text-[#0092B3]") 
                    : "text-black/40"
                )}
              >
                {t.fixedTime}
              </button>
              <button 
                type="button"
                onClick={() => setTimeType('range')}
                className={cn(
                  "flex-1 rounded-lg text-[10px] font-bold transition-all",
                  timeType === 'range' 
                    ? (user.role === 'driver' ? "bg-white shadow-sm text-[#FFD700]" : "bg-white shadow-sm text-[#0092B3]") 
                    : "text-black/40"
                )}
              >
                {t.rangeTime}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {timeType === 'fixed' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="pt-1"
                >
                  <input 
                    type="time"
                    value={fixedTime}
                    onChange={e => setFixedTime(e.target.value)}
                    className={cn(
                      "w-full bg-black/5 border-none rounded-xl py-3 px-6 font-black text-center text-base focus:ring-2",
                      user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                    )}
                  />
                </motion.div>
              )}

              {timeType === 'range' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex gap-2 pt-1"
                >
                  <input 
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className={cn(
                      "flex-1 bg-black/5 border-none rounded-xl py-3 px-4 font-black text-center text-xs focus:ring-2",
                      user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                    )}
                  />
                  <div className="flex items-center text-black/10 font-black">-</div>
                  <input 
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className={cn(
                      "flex-1 bg-black/5 border-none rounded-xl py-3 px-4 font-black text-center text-xs focus:ring-2",
                      user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button 
          type="submit"
          className={cn(
            "w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all",
            user.role === 'driver' ? "bg-[#FFD700] text-[#1A1A1A] shadow-[#FFD700]/20" : "bg-[#0092B3] text-white shadow-[#0092B3]/20"
          )}
        >
          {t.publish}
        </button>
      </form>
    </motion.div>
  );
}

function Profile({ user, onLogout, onClose, onUpdate, t, lang, setLang }: { 
  user: User, 
  onLogout: () => void, 
  onClose: () => void, 
  onUpdate: (u: User) => void,
  t: any,
  lang: LanguageCode,
  setLang: (l: LanguageCode) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.name.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user.phone);
  const [carModel, setCarModel] = useState(user.car_model || '');
  const [carNumber, setCarNumber] = useState(user.car_number || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = () => {
    onUpdate({
      ...user,
      name: `${firstName} ${lastName}`.trim(),
      phone,
      car_model: carModel,
      car_number: carNumber,
    });
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 transition-colors"
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-black tracking-tight">{t.profileTitle}</h2>
      </div>

      <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-black/5 relative overflow-hidden transition-colors">
        <div className={cn(
          "absolute -right-6 -top-6 w-24 h-24 rounded-full blur-[40px] opacity-10",
          user.role === 'driver' ? "bg-[#FFD700]" : "bg-[#0092B3]"
        )} />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center shadow-md shrink-0 relative group overflow-hidden",
            user.role === 'driver' ? "bg-[#FFD700] text-[#1A1A1A]" : "bg-[#0092B3] text-white"
          )}>
            {user.role === 'driver' ? <Car size={24} /> : <UserIcon size={24} />}
            
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[2px] cursor-pointer"
              >
                <Plus size={14} className="text-white" />
                <span className="text-[5px] font-black uppercase text-white mt-0.5">Rasm</span>
              </motion.div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="space-y-1">
                <input 
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={cn(
                    "w-full bg-black/5 border-none rounded-lg py-1 px-2 text-[10px] font-bold focus:ring-1",
                    user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                  )}
                  placeholder={t.placeholderName}
                />
                <input 
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={cn(
                    "w-full bg-black/5 border-none rounded-lg py-1 px-2 text-[9px] font-bold focus:ring-1",
                    user.role === 'driver' ? "focus:ring-[#FFD700]" : "focus:ring-[#0092B3]"
                  )}
                  placeholder="Familiya"
                />
              </div>
            ) : (
              <div className="flex flex-col">
                <h3 className="text-sm font-black truncate leading-tight uppercase font-mono">{firstName || 'Ism'}</h3>
                <p className="text-[9px] font-bold text-black/30 truncate uppercase tracking-tighter">{lastName || 'Familiya'}</p>
              </div>
            )}
            <div className={cn(
              "mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
              user.role === 'driver' ? "bg-[#FFD700]/20 text-[#B8860B]" : "bg-[#0092B3]/10 text-[#0092B3]"
            )}>
              <div className="w-1 h-1 rounded-full bg-current" />
              {user.role === 'driver' ? t.driver : t.passenger}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/5 relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-black/20">{t.nameLabel}</span>
            {isEditing ? (
              <button 
                onClick={handleSave} 
                className={cn(
                  "text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full",
                  user.role === 'driver' ? "bg-[#FFD700]/20 text-[#B8860B]" : "bg-[#0092B3]/10 text-[#0092B3]"
                )}
              >
                {t.save}
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)} 
                className={cn(
                  "text-black/30 text-[9px] font-black uppercase",
                  user.role === 'driver' ? "hover:text-[#B8860B]" : "hover:text-[#0092B3]"
                )}
              >
                {t.edit}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {user.role === 'driver' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/5 p-2.5 rounded-xl border border-transparent transition-colors">
                  <p className="text-[6px] font-black uppercase text-black/30 mb-0.5">{t.carModelLabel}</p>
                  {isEditing ? (
                    <input 
                      value={carModel}
                      onChange={e => setCarModel(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[10px] font-bold outline-none"
                    />
                  ) : (
                    <p className="font-bold text-[10px] truncate">{user.car_model || '---'}</p>
                  )}
                </div>
                <div className="bg-black/5 p-2.5 rounded-xl border border-transparent transition-colors">
                  <p className="text-[6px] font-black uppercase text-black/30 mb-0.5 text-center">{t.carNumberLabel}</p>
                  {isEditing ? (
                    <input 
                      value={carNumber}
                      onChange={e => setCarNumber(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-[10px] font-bold outline-none text-center"
                    />
                  ) : (
                    <p className="font-bold text-[10px] tracking-wider truncate text-center">{user.car_number || '---'}</p>
                  )}
                </div>
              </div>
            )}
            <div className="bg-black/5 p-2.5 rounded-xl border border-transparent transition-colors">
              <p className="text-[6px] font-black uppercase text-black/30 mb-0.5">{t.phoneLabel}</p>
              {isEditing ? (
                <input 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-[10px] font-bold outline-none"
                />
              ) : (
                <p className="font-bold text-[10px] text-black/40">{user.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-black/20 ml-2">Sozlamalar</span>
        
        <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-black/5 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center text-black/30">
                <Languages size={18} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.1em]">{t.language}</span>
            </div>
            <div className="flex gap-1 bg-black/5 p-1 rounded-xl">
              {(['qq', 'uz', 'ru'] as LanguageCode[]).map((l) => (
                <button 
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all",
                    lang === l ? "bg-white shadow-sm text-black" : "text-black/20 hover:text-black/40"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {showLogoutConfirm ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 rounded-3xl p-5 border border-red-100 space-y-4"
          >
            <p className="text-center text-xs font-bold text-red-600">{t.logoutConfirm}</p>
            <div className="flex gap-2">
              <button 
                onClick={onLogout}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-transform"
              >
                {t.yes}
              </button>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-white border border-red-100 text-red-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
              >
                {t.cancel}
              </button>
            </div>
          </motion.div>
        ) : (
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-3 text-red-500/40 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-3xl bg-black/5 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
        )}
      </div>

      <div className="bg-[#0092B3] rounded-[2rem] p-6 text-white relative overflow-hidden group">
        <div className="relative z-10 flex gap-4 items-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <MessageSquare size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-sm uppercase tracking-wider">{t.supportTitle}</h4>
            <p className="text-white/60 text-[10px] font-medium leading-tight mt-1">{t.supportDesc}</p>
          </div>
          <button className="bg-white text-[#0092B3] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
            {t.supportAction}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ message, t }: { message: string, t: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
      <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center">
        <Search size={32} />
      </div>
      <p className="font-bold text-sm uppercase tracking-widest">{message}</p>
    </div>
  );
}

function MyRideCard({ ride, socket, t }: { ride: any, socket: Socket, t: any, key?: any }) {
  const [localSeats, setLocalSeats] = useState(ride.seats);
  const [localTime, setLocalTime] = useState(ride.departure_time || '10:00');
  const [showConfirm, setShowConfirm] = useState(false);

  const hasChanges = localSeats !== ride.seats || localTime !== ride.departure_time;

  const handleSave = () => {
    socket.emit('update_ride', { ...ride, seats: localSeats, departure_time: localTime });
  };

  const handleDelete = () => {
    if (ride.status === 'deleted') {
      socket.emit('permanent_delete_ride', ride.id);
    } else {
      socket.emit('delete_ride', ride.id);
    }
    setShowConfirm(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-5 rounded-[2rem] border shadow-sm space-y-4 transition-colors",
        ride.status === 'deleted' ? "bg-black/[0.02] border-black/5" : "bg-white border-black/5"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center text-[#B8860B]">
            <Navigation size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-black text-black/30 uppercase tracking-tighter">
              <span>{ride.from_loc}</span>
              <ArrowRight size={10} />
              <span>{ride.to_loc}</span>
              {ride.departure_date === 'tomorrow' && (
                <span className="ml-2 bg-[#FFD700]/10 text-[#B8860B] px-1.5 py-0.5 rounded text-[8px]">{t.tomorrowMin}</span>
              )}
            </div>
            <h3 className="font-black text-sm">{ride.departure_time}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && ride.status !== 'deleted' && (
            <button 
              onClick={handleSave}
              className="px-3 py-1.5 bg-[#FFD700] text-[#1A1A1A] text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-[#FFD700]/20"
            >
              {t.save}
            </button>
          )}

          <AnimatePresence mode="wait">
            {showConfirm ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <button 
                  onClick={handleDelete}
                  className="px-2 py-1.5 bg-red-500 text-white text-[8px] font-black rounded-lg uppercase"
                >
                  {t.yes}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-1.5 bg-black/5 text-black/40 text-[8px] font-black rounded-lg uppercase"
                >
                  {t.no}
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={() => setShowConfirm(true)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  ride.status === 'deleted' ? "bg-black/5 text-black/20 hover:text-red-500" : "bg-red-50 text-red-500"
                )}
              >
                <Trash2 size={16} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {ride.status === 'active' && (
        <>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5">
            <div className="flex items-center justify-between bg-black/5 rounded-xl px-3 py-2">
              <span className="text-[8px] font-black uppercase text-black/30">{t.seatMin}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLocalSeats(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center text-[#B8860B]"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-black w-4 text-center">{localSeats}</span>
                <button 
                  onClick={() => setLocalSeats(prev => Math.min(10, prev + 1))}
                  className="w-6 h-6 bg-white rounded-md shadow-sm flex items-center justify-center text-[#B8860B]"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-black/5 rounded-xl px-3 py-2">
              <span className="text-[8px] font-black uppercase text-black/30">{t.timeLabel}</span>
              <input 
                type="time"
                value={localTime.includes(' - ') ? localTime.split(' - ')[0] : (localTime.includes(':') ? localTime : '10:00')}
                onChange={(e) => setLocalTime(e.target.value)}
                className="bg-transparent border-none p-0 text-[10px] font-black w-16 text-right focus:ring-0"
              />
            </div>
          </div>
          <p className="text-[7px] font-bold text-[#0092B3]/60 uppercase tracking-tighter text-center leading-tight">
            {t.myAdsHelper}
          </p>
        </>
      )}
    </motion.div>
  );
}

function MyRequestCard({ req, socket, t }: { req: any, socket: Socket, t: any, key?: any }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (req.status === 'deleted') {
      socket.emit('permanent_delete_request', req.id);
    } else {
      socket.emit('delete_request', req.id);
    }
    setShowConfirm(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-5 rounded-[2rem] border shadow-sm space-y-4 transition-colors",
        req.status === 'deleted' ? "bg-black/[0.02] border-black/5" : "bg-white border-black/5"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0092B3]/10 flex items-center justify-center text-[#0092B3]">
            <UserIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-black text-black/30 uppercase tracking-tighter">
              <span>{req.from_loc}</span>
              <ArrowRight size={10} />
              <span>{req.to_loc}</span>
              {req.departure_date === 'tomorrow' && (
                <span className="ml-2 bg-[#0092B3]/10 text-[#0092B3] px-1.5 py-0.5 rounded text-[8px]">{t.tomorrowMin}</span>
              )}
            </div>
            <h3 className="font-black text-sm">{req.departure_time}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {showConfirm ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <button 
                  onClick={handleDelete}
                  className="px-2 py-1.5 bg-red-500 text-white text-[8px] font-black rounded-lg uppercase"
                >
                  {t.yes}
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-1.5 bg-black/5 text-black/40 text-[8px] font-black rounded-lg uppercase"
                >
                  {t.no}
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={() => setShowConfirm(true)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  req.status === 'deleted' ? "bg-black/5 text-black/20 hover:text-red-500" : "bg-red-50 text-red-500"
                )}
              >
                <Trash2 size={16} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users size={12} className="text-black/20" />
          <span className="text-[10px] font-bold text-black/40 uppercase">{t.passengerCountLabel}:</span>
          <span className="text-[10px] font-black">{req.seats} {t.peopleMin}</span>
        </div>
        {req.status === 'deleted' && (
          <span className="text-[8px] font-black text-black/20 uppercase">{t.archived}</span>
        )}
      </div>
    </motion.div>
  );
}
