'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRight, CheckCircle2, User, Phone, Lock, Loader2, CreditCard } from 'lucide-react';
import { getAvailableSlots } from '@/actions/public-bookings';
import { createBooking } from '@/actions/bookings';
import { createPaymentPreference } from '@/actions/payments';

interface SlotData {
  time: string;
  status: string;
}

export default function BookingFlow({ courts, sysSettings, session }: { courts: any[], sysSettings?: any, session?: any }) {
  const isDark = sysSettings?.theme === 'dark';

  // VARIABLES DINÁMICAS DESDE LA BASE DE DATOS
  const splashDuration = sysSettings?.splashDuration || 1500;
  const bubbleDuration = sysSettings?.bubbleDuration || 3000;
  const splashLogo = sysSettings?.splashLogo || "";
  const splashName = sysSettings?.splashName || "Sistema PSP";
  const clubName = sysSettings?.clubName || "Padel Club";
  const sportEmoji = sysSettings?.sportEmoji || "🎾";

  // ESTADOS Y REFS
  const slotsRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showBubble, setShowBubble] = useState(sysSettings?.bubbleActive || false);

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // ESTADO RESTAURADO: Solo Nombre y Teléfono (Sin email)
  const [formData, setFormData] = useState({ 
    name: session ? `${session.name} ${session.lastName}`.trim() : '', 
    phone: session?.phone || '' 
  });

  // Calculate if deposit is required for this specific user
  const clientRequireDeposit = (() => {
    if (sysSettings?.requireDeposit === false) return false;
    if (sysSettings?.usersModuleEnabled && sysSettings?.requireDepositForRegistered === false && session) return false;
    return true;
  })();

  const upcomingDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  // EFECTO DEL SPLASH
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), splashDuration);
    return () => clearTimeout(timer);
  }, [splashDuration]);

  // EFECTO DE LA BURBUJA CENTRADA (Desaparece según el bubbleDuration)
  useEffect(() => {
    if (sysSettings?.bubbleActive) {
      const timer = setTimeout(() => setShowBubble(false), bubbleDuration);
      return () => clearTimeout(timer);
    }
  }, [sysSettings?.bubbleActive, bubbleDuration]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      setLoading(true);
      const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      // Auto-scroll a la sección de horarios
      setTimeout(() => {
        slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);

      getAvailableSlots(selectedCourt, dateStr).then(res => {
        if (res.success && res.data) {
          setSlots(res.data as SlotData[]);
        } else {
          setSlots([]);
        }
        setLoading(false);
        setSelectedSlot('');
      });
    }
  }, [selectedCourt, selectedDate]);

  const handleNextStep = () => {
    if (step === 1 && selectedCourt && selectedSlot) setStep(2);
  };

  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.phone) return;

    setLoading(true);
    setError('');

    try {
      const dateStr = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      const bookingResult = await createBooking({
        courtId: selectedCourt,
        date: dateStr,
        time: selectedSlot,
        name: formData.name,
        phone: formData.phone,
      });

      if (!bookingResult.success || !bookingResult.data) {
        setError(bookingResult.error || 'Error al crear la reserva');
        setLoading(false);
        return;
      }

      const { bookingId, fee, requireDeposit } = bookingResult.data;

      if (requireDeposit && fee > 0) {
        const paymentResult = await createPaymentPreference(bookingId);

        if (paymentResult.success && paymentResult.init_point) {
          window.location.href = paymentResult.init_point;
          return;
        } else {
          setStep(3);
          setLoading(false);
        }
      } else {
        setStep(3);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error en el flujo de reserva:', err);
      setError('Ocurrió un error inesperado. Intentá de nuevo.');
      setLoading(false);
    }
  };

  // --- PANTALLA SPLASH DE INICIO ---
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center animate-bounce">
          {splashLogo ? (
            <img src={splashLogo} alt={splashName} className="w-32 h-32 object-contain mb-6 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)]" />
          ) : (
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center font-black text-slate-900 text-5xl mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              {sportEmoji}
            </div>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-1">
          {splashName}
        </h1>
        <p className="text-emerald-400 font-bold tracking-widest text-sm uppercase">{clubName}</p>
      </div>
    );
  }

  // --- RENDER DE LA PWA ---
  return (
    <div className="w-full flex-1 flex flex-col relative bg-transparent">

      {/* HEADER HERO RENOVADO */}
      <div className="bg-slate-900 dark:bg-black px-6 py-10 text-center relative z-10 rounded-b-[2.5rem] shadow-md">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2">
          Reservá tu Cancha {sportEmoji}
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          Elegí día, horario y preparate para jugar.
        </p>
      </div>

      <div className="p-5 flex-1 overflow-y-auto pb-32 space-y-8 -mt-2 hide-scrollbar">

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">

            {/* Fechas */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-emerald-500" /> ¿Qué día jugás?
              </label>
              <div className="flex space-x-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {upcomingDays.map((date, i) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-16 p-3 rounded-2xl flex flex-col items-center justify-center transition-all snap-start shadow-sm border ${isSelected
                        ? 'bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-80 mb-1">
                        {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                      </span>
                      <span className="text-2xl font-black leading-none">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Canchas */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-emerald-500" /> Elegí tu cancha
              </label>
              <div className="grid grid-cols-2 gap-3">
                {courts.map(court => (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court.id)}
                    className={`p-4 rounded-2xl text-left transition-all border shadow-sm flex flex-col active:scale-[0.98] ${selectedCourt === court.id
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 transform scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                  >
                    <span className="font-bold text-base">{court.name}</span>
                    <span className="text-[11px] uppercase opacity-60 mt-1 font-bold">{court.surface || 'Piso Sintético'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios FOMO (Grilla Visual de Ocupación) */}
            {selectedCourt && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500" ref={slotsRef}>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-emerald-500" /> Horarios</div>
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Libre</span>
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-300 mr-1"></span>Ocupado</span>
                  </div>
                </label>

                {loading ? (
                  <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((slot, idx) => {
                      const isAvailable = slot.status === 'AVAILABLE';
                      const isSelected = selectedSlot === slot.time;

                      return (
                        <button
                          key={idx}
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`relative p-3.5 rounded-2xl text-center font-bold text-sm transition-all border overflow-hidden flex flex-col items-center justify-center active:scale-[0.98]
                            ${isAvailable
                              ? isSelected
                                ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-900/20 shadow-md transform scale-[1.02]'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 hover:text-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                            }
                          `}
                        >
                          <span className="text-lg">{slot.time} hs</span>
                          <span className="text-[10px] uppercase tracking-wider mt-0.5 opacity-80">
                            {isAvailable ? (isSelected ? 'Seleccionado' : 'Disponible') :
                              slot.status === 'FIXED' ? 'Abono Fijo' :
                                slot.status === 'BLOCKED' ? 'Cancha Cerrada' : 'Ocupado'}
                          </span>
                          {!isAvailable && (
                            <Lock className="absolute -right-2 -bottom-2 w-10 h-10 text-slate-200 dark:text-slate-700 opacity-50" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm font-medium">
                    No hay horarios configurados para este día.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- PASO 2: DATOS DEL CLIENTE --- */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in slide-in-from-right-8 duration-500 pt-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Resumen de Reserva</p>
                <p className="text-sm font-bold">
                  {selectedDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace(/^\w/, c => c.toUpperCase())} • {selectedSlot} hs
                </p>
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors">Modificar</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center"><User className="w-4 h-4 mr-2 text-slate-400" /> Nombre y Apellido</label>
                <input required type="text" placeholder="Ej: Augusto Basquez" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center"><Phone className="w-4 h-4 mr-2 text-slate-400" /> WhatsApp</label>
                <input required type="tel" placeholder="Ej: 3329 123456" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>

            {clientRequireDeposit && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 p-3 rounded-xl text-sm text-amber-800 dark:text-amber-200 font-medium flex items-start">
                <CreditCard className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>Al confirmar serás redirigido a <strong>MercadoPago</strong> para pagar la seña. Tu turno se confirma automáticamente una vez acreditado el pago.</span>
              </div>
            )}
          </form>
        )}

        {/* --- PASO 3: ESPERANDO PAGO / ÉXITO --- */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 absolute" />
              <div className="w-24 h-24 border-4 border-emerald-500 rounded-full animate-ping opacity-20"></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3">¡Reserva {clientRequireDeposit ? 'registrada' : 'confirmada'}!</h3>
            <p className="text-slate-500 font-medium px-4 leading-relaxed mb-6">
              {clientRequireDeposit
                ? `Tu turno queda confirmado una vez acreditado el pago. Te enviamos la confirmación por WhatsApp. ${sportEmoji}`
                : `¡Tu lugar está asegurado! Te enviamos los detalles por WhatsApp. ${sportEmoji}`
              }
            </p>

            {/* RESUMEN DEL TURNO EN PANTALLA DE ÉXITO */}
            <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-4 mb-8">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Detalles de tu turno</p>
              <div className="flex items-center text-slate-700 dark:text-slate-200">
                <MapPin className="w-5 h-5 mr-3 text-emerald-500" />
                <span className="font-bold text-lg">{courts.find(c => c.id === selectedCourt)?.name || 'Cancha'}</span>
              </div>
              <div className="flex items-center text-slate-700 dark:text-slate-200">
                <CalendarIcon className="w-5 h-5 mr-3 text-emerald-500" />
                <span className="font-bold text-lg capitalize">{selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="flex items-center text-slate-700 dark:text-slate-200">
                <Clock className="w-5 h-5 mr-3 text-emerald-500" />
                <span className="font-bold text-lg">{selectedSlot} hs</span>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 py-4 px-8 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full max-w-sm">
              Volver al inicio
            </button>
          </div>
        )}
      </div>

      {/* FOOTER FLOTANTE PWA */}
      {step < 3 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50">
          {step === 1 ? (
            <button
              onClick={handleNextStep}
              disabled={!selectedCourt || !selectedSlot}
              className="w-full flex items-center justify-center bg-emerald-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-emerald-600 active:scale-[0.98]"
            >
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={loading || !formData.name || !formData.phone}
              className="w-full flex items-center justify-center bg-slate-900 dark:bg-emerald-500 text-white font-bold text-lg py-4 rounded-2xl shadow-xl transition-all hover:bg-black dark:hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : clientRequireDeposit ? (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pagar Seña y Reservar
                </>
              ) : (
                <>
                  Confirmar Reserva <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* BURBUJA CENTRADA TEMPORIZADA */}
      {showBubble && sysSettings?.bubbleText && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="p-8 rounded-[2rem] shadow-2xl max-w-sm w-full animate-in zoom-in-90 fade-in slide-in-from-bottom-8 duration-500 pointer-events-auto"
            style={{ backgroundColor: sysSettings.bubbleColor || '#10b981', color: '#fff' }}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="text-6xl drop-shadow-md">{sportEmoji}</span>
              <p className="font-bold text-xl leading-snug">{sysSettings.bubbleText}</p>
            </div>
          </div>
        </div>
      )}

      {/* CSS Ocultar Scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}