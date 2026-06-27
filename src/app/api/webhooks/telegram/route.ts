import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Aquí puedes procesar los mensajes entrantes de Telegram
    // Ejemplo: buscar el chat_id y vincularlo a un usuario, o responder con las próximas reservas
    const chatId = data.message?.chat?.id;
    const text = data.message?.text;

    if (chatId && text === '/start') {
      // Enviar mensaje de bienvenida
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '¡Hola! Soy el bot de reservas. Pronto podrás consultar tus turnos desde aquí.'
          })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Telegram Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
