require('dotenv').config();

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_ID;
const to = '5493329684696'; // Admin number from the logs

async function testText() {
    console.log("Sending TEXT message...");
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: "Hola, esto es un mensaje de prueba de TEXTO." },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("TEXT Response:", response.status, data);
}

async function testInteractive() {
    console.log("Sending INTERACTIVE message...");
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: "Hola, esto es un mensaje de prueba INTERACTIVO." },
            action: {
                buttons: [
                    { type: 'reply', reply: { id: 'btn_1', title: 'Botón 1' } }
                ],
            },
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("INTERACTIVE Response:", response.status, data);
}

async function run() {
    await testText();
    await testInteractive();
}

run();
