'use client';

import { useState, useEffect, useRef } from 'react';
import { getAvailableSlotsByDate, getBookingsByPhone, cancelPublicBooking } from '@/actions/public-bookings';
import { createBooking } from '@/actions/bookings';
import { createPaymentPreference } from '@/actions/payments';
import { Send, Bot, CalendarDays, Clock, MapPin, XCircle } from 'lucide-react';

interface Court { id: string; name: string }

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  type?: 'text' | 'menu' | 'courts' | 'dates' | 'slots' | 'form' | 'success' | 'bookings_list';
  data?: any;
}

export default function BookingFlowChat({ courts, sysSettings, session }: { courts: Court[], sysSettings: any, session: any }) {
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // State for Booking Flow
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [aggregatedSlots, setAggregatedSlots] = useState<{ time: string; courts: Court[] }[]>([]);
  const [availableCourtsForSlot, setAvailableCourtsForSlot] = useState<Court[]>([]);

  // State for Global & Form
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    name: session ? `${session.name} ${session.lastName}`.trim() : '', 
    phone: session?.phone || '' 
  });
  
  // State for Input Box (Ask phone number)
  const [inputMode, setInputMode] = useState<'none' | 'ask_phone'>('none');
  const [inputText, setInputText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clubName = sysSettings?.clubName || 'T-Padel';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, inputMode]);

  useEffect(() => {
    setIsMounted(true);
    
    // Initial Greeting and Menu
    const isUserSystemEnabled = sysSettings?.usersModuleEnabled;
    const hasSession = !!session;

    let greeting = `¡Hola! Bienvenido a ${clubName}. Soy tu asistente virtual.`;
    if (isUserSystemEnabled && hasSession && session.name) {
      greeting = `¡Hola ${session.name}! Qué gusto verte de nuevo por acá.`;
    }

    setTimeout(() => {
      addBotMessage(greeting, 'text', 500);
      setTimeout(() => {
        addBotMessage('¿En qué te puedo ayudar hoy?', 'menu', 800);
      }, 1000);
    }, 300);
  }, []);

  const addBotMessage = (text: string, type: Message['type'] = 'text', delay = 600, data: any = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'bot', text, type, data }]);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text }]);
  };

  // --- MENU ACTIONS ---
  const handleMenuOption = (option: 'book' | 'view_bookings') => {
    setMessages(prev => prev.filter(m => m.type !== 'menu'));

    if (option === 'book') {
      addUserMessage('Quiero reservar un turno');
      addBotMessage('¡Excelente! ¿Para qué día estás buscando cancha?', 'dates');
    } else if (option === 'view_bookings') {
      addUserMessage('Ver mis reservas');
      if (formData.phone) {
        fetchAndShowBookings(formData.phone);
      } else {
        addBotMessage('Claro que sí. Por favor escríbeme tu número de celular (con código de área) aquí abajo para buscar tus turnos:', 'text');
        setInputMode('ask_phone');
      }
    }
  };

  // --- VIEW BOOKINGS FLOW ---
  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    if (inputMode === 'ask_phone') {
      const phone = inputText.trim();
      addUserMessage(phone);
      setInputMode('none');
      setInputText('');
      fetchAndShowBookings(phone);
    }
  };

  const fetchAndShowBookings = (phone: string) => {
    setIsTyping(true);
    getBookingsByPhone(phone).then(res => {
      setIsTyping(false);
      if (res.success && res.data && res.data.length > 0) {
        addBotMessage('Encontré estas reservas asociadas a tu número:', 'bookings_list', 600, res.data);
        setTimeout(() => {
          addBotMessage('¿Hay algo más en lo que te pueda ayudar?', 'menu', 1500);
        }, 1200);
      } else {
        addBotMessage('No encontré ninguna reserva reciente asociada a este número.', 'text');
        setTimeout(() => {
          addBotMessage('¿Te ayudo a reservar un nuevo turno?', 'menu', 800);
        }, 1000);
      }
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro que deseas cancelar este turno?')) return;
    
    setIsTyping(true);
    const res = await cancelPublicBooking(bookingId, formData.phone);
    setIsTyping(false);
    
    if (res.success) {
      addBotMessage('¡Listo! Tu turno ha sido cancelado con éxito.', 'text');
      // Volver a cargar la lista para que se vea reflejado
      fetchAndShowBookings(formData.phone);
    } else {
      addBotMessage(`No pude cancelar el turno: ${res.error}`, 'text');
      setTimeout(() => {
        addBotMessage('¿Te puedo ayudar con algo más?', 'menu', 800);
      }, 1000);
    }
  };

  // --- BOOKING FLOW ---
  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleSelectDate = (dateStr: string, label: string) => {
    setSelectedDate(dateStr);
    setMessages(prev => prev.filter(m => m.type !== 'dates')); 
    addUserMessage(label);
    
    setIsTyping(true);
    getAvailableSlotsByDate(dateStr).then(res => {
      setIsTyping(false);
      if (res.success && res.data && res.data.length > 0) {
        setAggregatedSlots(res.data as any);
        addBotMessage('Estos son los horarios que encontré disponibles:', 'slots');
      } else {
        setAggregatedSlots([]);
        addBotMessage('Uff, parece que no hay ninguna cancha libre en todo el día.', 'text');
        setTimeout(() => {
          addBotMessage('¿Quieres intentar con otra fecha u otra consulta?', 'menu', 800);
        }, 800);
      }
    });
  };

  const handleSelectSlot = (time: string, availableCourts: Court[]) => {
    setSelectedSlot(time);
    setAvailableCourtsForSlot(availableCourts);
    setMessages(prev => prev.filter(m => m.type !== 'slots')); 
    addUserMessage(time);

    if (availableCourts.length === 1) {
        addBotMessage(`Perfecto, a las ${time} tengo libre la ${availableCourts[0].name}. ¿Confirmamos en esta cancha?`, 'courts');
    } else {
        addBotMessage(`A las ${time} tengo todas estas canchas libres. ¿Cuál prefieres?`, 'courts');
    }
  };

  const handleSelectCourt = (court: Court) => {
    setSelectedCourt(court.id);
    setMessages(prev => prev.filter(m => m.type !== 'courts'));
    addUserMessage(court.name);
    addBotMessage(`¡Excelente elección! Turno reservado en ${court.name}. Para finalizar necesito que confirmes tus datos.`, 'form');
  };

  const handleRestartBookingFlow = () => {
    setMessages(prev => prev.filter(m => m.type !== 'form'));
    setSelectedDate('');
    setSelectedSlot('');
    setSelectedCourt('');
    addUserMessage('Quiero elegir otra fecha / hora');
    setTimeout(() => {
      addBotMessage('No hay problema. ¿Para qué día buscás cancha?', 'dates', 400);
    }, 400);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt || !selectedDate || !selectedSlot) return;

    setMessages(prev => prev.filter(m => m.type !== 'form'));
    addUserMessage('Necesito completar mis datos');
    
    setIsTyping(true);
    setLoading(true);
    try {
      const bookingResult = await createBooking({
        courtId: selectedCourt,
        date: selectedDate,
        time: selectedSlot,
        name: formData.name,
        phone: formData.phone,
      });

      if (!bookingResult.success || !bookingResult.data) {
        addBotMessage(bookingResult.error || 'Hubo un error al crear la reserva.', 'text');
        setLoading(false);
        return;
      }

      const { bookingId, fee } = bookingResult.data;
      const clientRequireDeposit = sysSettings?.requireDeposit && (!session || sysSettings?.requireDepositForRegistered);

      if (clientRequireDeposit && fee > 0) {
        addBotMessage('Tu reserva requiere seña. Te estoy redirigiendo a MercadoPago...', 'text');
        const paymentResult = await createPaymentPreference(bookingId);
        if (paymentResult.success && paymentResult.init_point) {
          window.location.href = paymentResult.init_point;
          return;
        }
      }
      
      addBotMessage(`¡Todo listo! Tu turno quedó súper confirmado para el ${selectedDate.split('-').reverse().join('/')} a las ${selectedSlot}. ¡Te esperamos!`, 'success');
      setTimeout(() => {
        addBotMessage('¿Te puedo ayudar con algo más?', 'menu', 1500);
      }, 1200);
    } catch (err) {
      console.error(err);
      addBotMessage('Ocurrió un error inesperado.', 'text');
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-gray-50" />;

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f0f2f5] font-sans w-full relative">
      <header className="px-4 py-3 bg-[#075e54] shadow-md flex items-center gap-4 sticky top-0 z-20">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner">
            <Bot className="w-6 h-6 text-[#075e54]" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#075e54] rounded-full"></div>
        </div>
        <div>
          <h1 className="font-bold text-white leading-tight text-lg">{clubName}</h1>
          <p className="text-xs text-white/80 font-medium">En línea</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 hide-scrollbar relative bg-[#efeae2]">
        {sysSettings?.heroImage && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `url('${sysSettings.heroImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(5px)'
            }}
          />
        )}

        <div className="relative z-10 flex flex-col space-y-4">
          <div className="flex justify-center my-4">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500 bg-[#e1e2e3] px-3 py-1 rounded-lg shadow-sm">Hoy</span>
          </div>
        
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <div key={msg.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} animate-in fade-in slide-in-from-bottom-2`}>
              {msg.text && (
                <div 
                  className={`max-w-[85%] px-3 py-2 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.1)] text-[15px] relative ${
                    !isBot 
                      ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <svg viewBox="0 0 8 13" className={`absolute top-0 w-2 h-3 ${isBot ? '-left-[8px] text-white' : '-right-[8px] text-[#dcf8c6]'}`}>
                    <path fill="currentColor" d={isBot ? "M8 0L0 0l0 13C0 6 3 0 8 0z" : "M0 0h8v13C8 6 5 0 0 0z"} />
                  </svg>
                </div>
              )}

              {msg.type === 'menu' && (
                <div className="mt-2 flex flex-col gap-2 w-[80%] max-w-sm ml-2">
                  <button onClick={() => handleMenuOption('book')} className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-gray-800 font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors text-center">
                    Reservar un turno
                  </button>
                  <button onClick={() => handleMenuOption('view_bookings')} className="py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-gray-800 font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors text-center">
                    Ver mis reservas
                  </button>
                </div>
              )}

              {msg.type === 'bookings_list' && msg.data && (
                <div className="mt-2 flex flex-col gap-3 w-full max-w-sm ml-2">
                  {msg.data.map((b: any) => (
                    <div key={b.id} className={`bg-white p-3 rounded-xl shadow-sm border-l-4 ${b.status === 'CANCELLED' ? 'border-red-400 opacity-60' : 'border-[#25D366]'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800">{b.courtName}</span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                          b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                          b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/> {b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {b.time}</span>
                      </div>
                      {sysSettings?.clientCancellations && (b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <div className="mt-3 pt-3 border-t flex justify-end">
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar turno
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {msg.type === 'dates' && (
                <div className="mt-2 ml-2 flex overflow-x-auto gap-3 pb-2 w-[90vw] max-w-md hide-scrollbar">
                  {upcomingDays.map((d, i) => {
                    const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                    const dayName = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : d.toLocaleDateString('es-ES', { weekday: 'short' });
                    const monthName = d.toLocaleDateString('es-ES', { month: 'short' });
                    const dayNum = d.getDate();
                    const label = `${dayName} ${dayNum}`;
                    
                    return (
                      <button 
                        key={dateStr} 
                        onClick={() => handleSelectDate(dateStr, label)}
                        className="shrink-0 w-[72px] h-[84px] flex flex-col items-center justify-start bg-white rounded-xl shadow-sm active:scale-95 transition-all border border-gray-200 hover:border-[#075e54] overflow-hidden group"
                      >
                        <div className="w-full bg-gray-100 text-gray-600 text-[10px] uppercase font-black py-1.5 text-center group-hover:bg-[#075e54] group-hover:text-white transition-colors">
                          {dayName}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center leading-none w-full bg-white">
                          <span className="text-2xl font-black text-[#075e54]">{dayNum}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">{monthName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {msg.type === 'slots' && (
                <div className="mt-2 ml-2 grid grid-cols-3 gap-2 w-[85%] max-w-sm">
                  {aggregatedSlots.map(slot => (
                    <button 
                      key={slot.time} 
                      onClick={() => handleSelectSlot(slot.time, slot.courts)}
                      className="py-2.5 text-center rounded-xl font-bold text-sm shadow-sm transition-all border bg-white border-gray-100 text-[#075e54] hover:bg-gray-50 active:scale-95"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}

              {msg.type === 'courts' && (
                <div className="mt-2 ml-2 flex flex-col gap-2 w-[80%] max-w-sm">
                  {availableCourtsForSlot.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => handleSelectCourt(c)}
                      className="py-3 px-4 bg-white border border-gray-100 rounded-xl text-gray-800 font-bold text-sm shadow-sm flex justify-between items-center active:scale-95 transition-transform"
                    >
                      {c.name}
                      <span className="text-[#075e54] font-bold text-lg leading-none">›</span>
                    </button>
                  ))}
                </div>
              )}

              {msg.type === 'form' && (
                <div className="mt-2 ml-2 w-[85%] max-w-sm bg-white p-4 rounded-2xl shadow-sm">
                  <div className="flex flex-col gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                    <div className="flex items-center justify-between text-gray-700"><span className="flex items-center gap-1 opacity-70"><CalendarDays className="w-4 h-4"/> Día</span> <strong className="text-gray-900">{selectedDate.split('-').reverse().join('/')}</strong></div>
                    <div className="flex items-center justify-between text-gray-700"><span className="flex items-center gap-1 opacity-70"><Clock className="w-4 h-4"/> Hora</span> <strong className="text-gray-900">{selectedSlot}</strong></div>
                    <div className="flex items-center justify-between text-gray-700"><span className="flex items-center gap-1 opacity-70"><MapPin className="w-4 h-4"/> Cancha</span> <strong className="text-gray-900">{courts.find(c=>c.id===selectedCourt)?.name}</strong></div>
                  </div>
                  <form onSubmit={handleFinalSubmit} className="space-y-3">
                    <input 
                      type="text" required disabled={!!session} placeholder="Nombre completo"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#075e54]"
                    />
                    <input 
                      type="tel" required placeholder="Teléfono"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#075e54]"
                    />
                    <button 
                      type="submit" disabled={loading}
                      className="w-full bg-[#075e54] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                    >
                      {loading ? 'Procesando...' : sysSettings?.requireDeposit ? `Pagar Seña y Confirmar` : 'Confirmar Reserva'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRestartBookingFlow}
                      disabled={loading}
                      className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold text-sm flex justify-center items-center mt-2 active:scale-95 transition-transform hover:bg-gray-200"
                    >
                      Cambiar de día / hora
                    </button>
                  </form>
                </div>
              )}

              {msg.type === 'success' && (
                <div className="mt-3 ml-2 w-[85%] max-w-sm">
                  <button onClick={() => window.location.reload()} className="w-full text-sm font-bold bg-white text-gray-800 px-4 py-3 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center gap-2">
                    <CalendarDays className="w-4 h-4"/> Agendar otro turno
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start animate-in fade-in">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] flex items-center gap-1.5 relative ml-2">
              <svg viewBox="0 0 8 13" className="absolute top-0 -left-[8px] w-2 h-3 text-white">
                <path fill="currentColor" d="M8 0L0 0l0 13C0 6 3 0 8 0z" />
              </svg>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>
      
      {/* Input Area (Bottom Bar) */}
      <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 sticky bottom-0 z-20">
        {inputMode === 'ask_phone' ? (
          <form onSubmit={handleTextInputSubmit} className="flex-1 flex gap-2">
            <input
              type="tel"
              autoFocus
              placeholder="Ej: 1122334455"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-white border-0 rounded-full px-5 py-3 text-sm focus:outline-none shadow-sm"
            />
            <button type="submit" disabled={!inputText.trim()} className="w-12 h-12 bg-[#075e54] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm disabled:opacity-50">
              <Send className="w-5 h-5 -ml-1" />
            </button>
          </form>
        ) : (
          <div className="flex-1 bg-white rounded-full px-5 py-3 shadow-sm flex items-center justify-center">
            <span className="text-xs text-gray-400 font-medium">Asistente Virtual Automatizado</span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
