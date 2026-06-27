import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { subscription, userId } = data;

    if (!subscription || !subscription.endpoint || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (userId === 'ADMIN') {
      // Ensure dummy user exists to avoid ForeignKeyConstraintViolation
      await prisma.user.upsert({
        where: { email: 'admin_push@system.local' },
        update: {},
        create: {
          id: 'ADMIN',
          email: 'admin_push@system.local',
          name: 'System Admin',
          role: 'ADMIN'
        }
      });
    }

    // Upsert subscription
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
