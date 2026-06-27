'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function loginAdmin(formData: FormData) {
  try {
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;

    const settings = await prisma.systemSetting.findUnique({ where: { id: 1 } });
    
    if (!settings) {
      return { success: false, error: 'Error del sistema' };
    }

    if (user === settings.adminUser && pass === settings.adminPass) {
      // 24 horas de expiración
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const cookieStore = await cookies();
      cookieStore.set('admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires,
        path: '/',
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Credenciales inválidas' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_auth');
}
