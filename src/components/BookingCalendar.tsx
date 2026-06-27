'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Slot = { start: string; end: string };

export default function BookingCalendar({ 
  availableSlots, 
  onSelectSlot 
}: { 
  availableSlots: Slot[], 
  onSelectSlot: (slot: Slot) => void 
}) {
  const [selected, setSelected] = useState<Slot | null>(null);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-center">Horarios Disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        {availableSlots.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No hay turnos disponibles para esta fecha.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {availableSlots.map((slot, index) => {
              const isSelected = selected?.start === slot.start;
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`w-full h-12 ${isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  onClick={() => {
                    setSelected(slot);
                    onSelectSlot(slot);
                  }}
                >
                  {formatTime(slot.start)}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
