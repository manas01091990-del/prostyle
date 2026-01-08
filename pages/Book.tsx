
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  User, 
  Scissors, 
  MessageCircle, 
  Copy,
  ChevronLeft,
  ArrowRight,
  Lock,
  Zap,
  Loader2,
  ShieldCheck,
  Star,
  Sparkles
} from 'lucide-react';
import { SERVICES, PHONE_NUMBER, BRAND_NAME, TEAM_MEMBERS } from '../constants';

// Capacity per individual barber per slot.
const MAX_BOOKINGS_PER_ARTISAN_SLOT = 2;

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', 
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', 
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', 
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', 
  '09:00 PM', '09:30 PM', '10:00 PM'
];

const Book = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service');
  
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [step, setStep] = useState<'barber' | 'form' | 'processing' | 'confirm'>('barber');
  const [bookingId, setBookingId] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    serviceId: initialServiceId || '',
    barberId: '',
    date: getTodayDate(),
    time: '',
    notes: ''
  });

  // Sync with persistent storage and cleanup expired dates
  useEffect(() => {
    const syncReservations = () => {
      const storageKey = 'prostyle_artisan_reservations';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const today = getTodayDate();
        // Keep only future or today's appointments
        const validSlots = parsed.filter(slot => {
          const [date] = slot.split('|');
          return date >= today;
        });
        setBookedSlots(validSlots);
        localStorage.setItem(storageKey, JSON.stringify(validSlots));
      }
    };
    syncReservations();
    // Refresh periodically to stay synced across tabs
    const interval = setInterval(syncReservations, 30000);
    return () => clearInterval(interval);
  }, []);

  const selectedService = useMemo(() => 
    SERVICES.find(s => s.id === formData.serviceId), 
    [formData.serviceId]
  );

  const selectedBarber = useMemo(() => 
    TEAM_MEMBERS.find(t => t.id === formData.barberId),
    [formData.barberId]
  );

  const generateId = () => {
    return `PS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleBarberSelect = (id: string) => {
    setFormData(prev => ({ ...prev, barberId: id }));
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    setTimeout(() => {
      // Create a unique composite key that includes the specific barber
      const artisanSlotKey = `${formData.date}|${formData.time}|${formData.barberId}`;
      const updatedBookings = [...bookedSlots, artisanSlotKey];
      
      setBookedSlots(updatedBookings);
      localStorage.setItem('prostyle_artisan_reservations', JSON.stringify(updatedBookings));

      setBookingId(generateId());
      setStep('confirm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2000);
  };

  const handleWhatsAppRedirect = () => {
    const serviceName = selectedService?.name || "Service";
    const barberName = selectedBarber?.name || "Artisan";
    const message = `RESERVATION CONFIRMATION: ${BRAND_NAME}
-------------------------
ID: ${bookingId}
CLIENT: ${formData.name}
PHONE: ${formData.phone}
ARTISAN: ${barberName}
COLLECTION: ${serviceName}
DATE: ${formData.date}
TIME: ${formData.time}
NOTES: ${formData.notes || 'No special requests'}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${PHONE_NUMBER}?text=${encodedMessage}`, '_blank');
  };

  // Logic: Only block slots for the currently selected barber
  const getArtisanBookingCount = (time: string) => {
    const slotKey = `${formData.date}|${time}|${formData.barberId}`;
    return bookedSlots.filter(s => s === slotKey).length;
  };

  if (step === 'barber') {
    return (
      <div className="px-8 py-20 max-w-5xl mx-auto min-h-screen bg-[#050505] animate-in fade-in duration-1000">
        <div className="mb-20 text-center space-y-6">
          <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.6em] uppercase text-center block">Phase I</span>
          <h1 className="text-6xl md:text-8xl font-serif text-[#F5F5F0] leading-none tracking-tighter italic text-center">The Collective.</h1>
          <p className="text-gray-500 max-w-lg mx-auto font-light">Choose the artisan who will architect your transformation.</p>
        </div>

        <div className="space-y-6">
          {/* Tabular Header - Visible only on larger screens */}
          <div className="hidden md:grid grid-cols-12 gap-8 px-12 py-6 border-b border-white/5 text-[9px] font-bold tracking-[0.4em] uppercase text-gray-700">
            <div className="col-span-5">Identity</div>
            <div className="col-span-4">Artisanal Focus</div>
            <div className="col-span-3 text-right">Ritual Request</div>
          </div>

          {TEAM_MEMBERS.map((barber) => (
            <div 
              key={barber.id}
              onClick={() => handleBarberSelect(barber.id)}
              className="group relative grid grid-cols-1 md:grid-cols-12 items-center gap-8 p-8 md:p-12 bg-[#0A0A0A] hover:bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 rounded-[2.5rem] transition-all duration-700 cursor-pointer overflow-hidden shadow-2xl"
            >
              {/* Identity Column */}
              <div className="col-span-1 md:col-span-5 flex items-center gap-8">
                <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-[#D4AF37]/50 transition-all duration-700">
                  <img src={barber.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100 transition-all duration-1000" alt={barber.name} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl md:text-4xl font-serif text-white italic group-hover:not-italic transition-all uppercase leading-none">{barber.name}</h3>
                  <div className="flex items-center gap-2">
                    <Sparkles size={10} className="text-[#D4AF37]" />
                    <p className="text-[9px] font-bold tracking-[0.3em] text-[#D4AF37] uppercase">{barber.title}</p>
                  </div>
                </div>
              </div>

              {/* Design Philosophy Column */}
              <div className="col-span-1 md:col-span-4">
                <p className="text-gray-500 text-xs font-light leading-relaxed max-w-sm">
                  {barber.bio}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {barber.specialties.slice(0, 3).map(spec => (
                    <span key={spec} className="text-[7px] font-bold tracking-[0.2em] uppercase text-white/30 border border-white/5 px-2.5 py-1.5 rounded-full">{spec}</span>
                  ))}
                </div>
              </div>

              {/* Action Column */}
              <div className="col-span-1 md:col-span-3 text-right">
                <button className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold tracking-[0.4em] uppercase text-gray-400 group-hover:bg-[#D4AF37] group-hover:text-black group-hover:border-[#D4AF37] transition-all shadow-xl group-hover:scale-105 active:scale-95">
                  Select Artisan
                </button>
              </div>

              {/* Dynamic Aura background glow */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
        
        <div className="mt-20 text-center opacity-20">
          <p className="text-[8px] font-bold tracking-[0.6em] uppercase text-white">Confidential Selection Process • PROSTYLE NYC</p>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 animate-in fade-in duration-500">
        <div className="relative mb-8">
           <Loader2 className="text-[#D4AF37] animate-spin" size={64} strokeWidth={1} />
           <ShieldCheck className="absolute inset-0 m-auto text-white/20" size={24} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#D4AF37] animate-pulse">Syncing with Artisan Portfolio</p>
        <h2 className="text-3xl font-serif italic text-white mt-4">Verifying Exclusive Slot...</h2>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="px-8 py-20 max-w-2xl mx-auto min-h-screen bg-[#050505] animate-in zoom-in-95 duration-700">
        <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,1)]">
          <div className="bg-gradient-to-br from-[#D4AF37] to-[#8B735B] p-12 text-black text-center space-y-4">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-2 shadow-2xl">
              <CheckCircle size={40} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-4xl font-serif italic font-bold">Ritual Secured.</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mt-2">Private Reference Generated</p>
            </div>
          </div>

          <div className="p-10 md:p-14 space-y-12">
            <div className="text-center space-y-4 pb-10 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-600">Confidential Booking ID</p>
              <div className="flex items-center justify-center gap-6">
                <span className="text-5xl font-serif text-[#F5F5F0] tracking-widest gold-text-shimmer">{bookingId}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bookingId);
                  }}
                  className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-[#D4AF37] hover:bg-white/10 transition-all active:scale-90"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                { label: 'Client', value: formData.name },
                { label: 'Assigned Artisan', value: selectedBarber?.name },
                { label: 'Treatment', value: selectedService?.name },
                { label: 'Ritual Start', value: `${formData.date} @ ${formData.time}` },
                { label: 'Total Investment', value: `₹${selectedService?.price}`, highlight: true }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">{item.label}</span>
                  <span className={`${item.highlight ? 'text-[#D4AF37] font-serif text-2xl italic' : 'text-[#F5F5F0] font-light text-lg'}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6 pt-6">
              <button 
                onClick={handleWhatsAppRedirect}
                className="w-full py-8 bg-[#D4AF37] text-black rounded-full text-[11px] font-bold tracking-[0.5em] uppercase flex items-center justify-center gap-4 shadow-2xl hover:bg-white hover:scale-[1.02] transition-all active:scale-95"
              >
                Transmit via WhatsApp <MessageCircle size={22} />
              </button>
              
              <button 
                onClick={() => setStep('form')}
                className="w-full py-4 text-gray-600 text-[9px] font-bold tracking-[0.4em] uppercase hover:text-white transition-colors"
              >
                Refine Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-20 max-w-6xl mx-auto min-h-screen bg-[#050505] animate-in fade-in duration-1000">
      <div className="mb-20 text-center space-y-6 relative">
        <button 
          onClick={() => setStep('barber')}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all"
        >
          <ChevronLeft size={16} /> Reassign Artisan
        </button>
        <span className="text-[#D4AF37] text-[10px] font-bold tracking-[0.6em] uppercase text-center block">Phase II</span>
        <h1 className="text-7xl md:text-8xl font-serif text-[#F5F5F0] leading-none tracking-tighter italic text-center">The Details.</h1>
        <div className="flex items-center justify-center gap-4 text-gray-400">
           <img src={selectedBarber?.image} className="w-8 h-8 rounded-full grayscale border border-white/10" alt="" />
           <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Personal Artisan: {selectedBarber?.name}</p>
        </div>
      </div>

      <form onSubmit={handleInitialSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-[#0A0A0A] rounded-[3rem] p-10 md:p-14 border border-white/5 space-y-12 shadow-2xl">
            <h3 className="text-2xl font-serif text-[#F5F5F0] italic flex items-center gap-4">
              <User className="text-[#D4AF37]" size={24} /> Portfolio Data
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Legal Name</label>
                <input 
                  required
                  type="text"
                  className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#D4AF37]/50 font-light transition-all"
                  placeholder="e.g. Marcus V."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Private Line</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 font-light">+91</span>
                  <input 
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#D4AF37]/50 font-light transition-all"
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Collection</label>
                <div className="relative">
                  <select 
                    required
                    className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#D4AF37]/50 appearance-none font-light pr-12 transition-all cursor-pointer"
                    value={formData.serviceId}
                    onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  >
                    <option value="" className="bg-[#0A0A0A]">Select Service...</option>
                    {SERVICES.map(s => <option key={s.id} value={s.id} className="bg-[#0A0A0A]">{s.name}</option>)}
                  </select>
                  <Scissors className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Date of Ritual</label>
                <div className="relative">
                  <input 
                    required
                    type="date"
                    min={getTodayDate()}
                    className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#D4AF37]/50 font-light transition-all block cursor-pointer [color-scheme:dark]"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})} 
                  />
                  <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Aesthetic Notes</label>
              <textarea 
                className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl text-white outline-none focus:ring-1 focus:ring-[#D4AF37]/50 font-light transition-all h-32"
                placeholder="Specific structural requests..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0A0A0A] rounded-[3rem] p-10 border border-white/5 space-y-8 h-full flex flex-col shadow-2xl">
            <h3 className="text-2xl font-serif text-[#F5F5F0] italic flex items-center gap-4">
              <Clock className="text-[#D4AF37]" size={24} /> Artisan Slots
            </h3>
            
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-600">Timeline for {selectedBarber?.name}</p>
            
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2 flex-grow">
              {timeSlots.map((slot) => {
                const count = getArtisanBookingCount(slot);
                const isFull = count >= MAX_BOOKINGS_PER_ARTISAN_SLOT;
                const isPartiallyFull = count === 1;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isFull}
                    onClick={() => setFormData({...formData, time: slot})}
                    className={`relative py-5 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all border flex items-center justify-center ${
                      isFull 
                        ? 'bg-black/60 text-gray-800 border-white/5 cursor-not-allowed line-through' 
                        : formData.time === slot 
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                        : isPartiallyFull
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 hover:border-[#D4AF37]'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {isFull && <Lock size={10} className="absolute left-3 top-3 opacity-30" />}
                    {isPartiallyFull && !isFull && formData.time !== slot && (
                      <span className="absolute -top-1 -right-1 bg-white text-black text-[7px] px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                        <Zap size={6} fill="black" /> 1 SPOT
                      </span>
                    )}
                    {slot}
                  </button>
                );
              })}
            </div>

            <div className="pt-8 border-t border-white/5 space-y-6 mt-auto">
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Session Value</p>
                <p className="text-3xl font-serif italic text-[#D4AF37]">₹{selectedService?.price || '0'}</p>
              </div>
              
              <button 
                type="submit"
                disabled={!formData.name || !formData.phone || !formData.serviceId || !formData.date || !formData.time}
                className="w-full py-7 bg-white text-black rounded-full text-[10px] font-bold tracking-[0.4em] uppercase disabled:opacity-20 flex items-center justify-center gap-4 shadow-xl hover:bg-[#D4AF37] transition-all"
              >
                Review Ritual <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Book;
