// src/lib/whatsapp/session.ts
// Estado conversacional en memoria para el flujo de reservas por WhatsApp.
// Cada teléfono tiene una sesión que se auto-limpia después de 30 minutos.

export type SessionStep =
    | 'IDLE'
    | 'CHOOSING_DATE'
    | 'CHOOSING_COURT'
    | 'CHOOSING_SLOT'
    | 'CONFIRMING'
    | 'WAITING_NAME';

export interface WhatsAppSession {
    step: SessionStep;
    courtId?: string;
    courtName?: string;
    date?: string;       // "YYYY-MM-DD"
    dateLabel?: string;   // "Hoy", "Mañana", "Pasado Mañana"
    slotTime?: string;   // "HH:mm"
    slotEnd?: string;    // "HH:mm"
    userId?: string;
    clientName?: string;  // Nombre ingresado por el usuario
    updatedAt: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

// Store global — persiste entre requests en el mismo proceso Node
const sessions = new Map<string, WhatsAppSession>();

// ============================================================================
// GET — Obtener sesión del usuario (crea una nueva si no existe o expiró)
// ============================================================================
export function getSession(phone: string): WhatsAppSession {
    const existing = sessions.get(phone);

    if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) {
        return existing;
    }

    // Sesión nueva o expirada
    const fresh: WhatsAppSession = {
        step: 'IDLE',
        updatedAt: Date.now(),
    };
    sessions.set(phone, fresh);
    return fresh;
}

// ============================================================================
// UPDATE — Actualizar parcialmente la sesión
// ============================================================================
export function updateSession(phone: string, data: Partial<WhatsAppSession>): WhatsAppSession {
    const current = getSession(phone);
    const updated: WhatsAppSession = {
        ...current,
        ...data,
        updatedAt: Date.now(),
    };
    sessions.set(phone, updated);
    return updated;
}

// ============================================================================
// CLEAR — Limpiar la sesión al finalizar un flujo
// ============================================================================
export function clearSession(phone: string): void {
    sessions.delete(phone);
}

// ============================================================================
// CLEANUP — Limpiar sesiones expiradas (se puede llamar periódicamente)
// ============================================================================
export function cleanupSessions(): void {
    const now = Date.now();
    for (const [phone, session] of sessions) {
        if (now - session.updatedAt >= SESSION_TTL_MS) {
            sessions.delete(phone);
        }
    }
}
