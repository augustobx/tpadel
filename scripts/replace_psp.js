const fs = require('fs');
const path = require('path');

const replacements = [
    { file: 'src/lib/whatsapp/notifications.ts', from: 'psp', to: 'tpadel' },
    { file: 'src/lib/whatsapp/handler.ts', from: 'PSP Padel Club', to: 'T-Padel' },
    { file: 'src/lib/whatsapp/handler.ts', from: 'cliente@psp.local', to: 'cliente@tpadel.local' },
    { file: 'src/lib/whatsapp/api.ts', from: 'PSP Padel Club', to: 'T-Padel' },
    { file: 'src/components/UserWelcomeSplash.tsx', from: 'Comunidad PSP', to: 'Comunidad T-Padel' },
    { file: 'src/components/PublicNavbar.tsx', from: '"PSP Padel"', to: '"T-Padel"' },
    { file: 'src/components/BookingFlow.tsx', from: '"Sistema PSP"', to: '"Sistema T-Padel"' },
    { file: 'src/components/AdminSidebar.tsx', from: '>PSP<', to: '>T-Padel<' },
    { file: 'src/actions/user-auth.ts', from: 'psp_user_session', to: 'tpadel_user_session' },
    { file: 'src/actions/user-auth.ts', from: 'psp_skip_registration', to: 'tpadel_skip_registration' },
    { file: 'src/app/page.tsx', from: 'psp_skip_registration', to: 'tpadel_skip_registration' },
    { file: 'src/app/tv/page.tsx', from: 'PSP Padel System', to: 'T-Padel System' },
    { file: 'src/app/layout.tsx', from: 'Sistema PSP', to: 'Sistema T-Padel' },
    { file: 'src/actions/public-tournaments.ts', from: '@psp.com', to: '@tpadel.com' },
    { file: 'src/actions/payments.ts', from: '@psp.local', to: '@tpadel.local' },
    { file: 'src/app/global-error.tsx', from: '[PSP Global Error]', to: '[T-Padel Global Error]' },
    { file: 'src/app/error.tsx', from: '[PSP Error Boundary]', to: '[T-Padel Error Boundary]' },
    { file: 'src/actions/bookings.ts', from: '@cliente.psp', to: '@cliente.tpadel' },
    { file: 'src/app/(admin)/admin/usuarios/page.tsx', from: 'comunidad PSP', to: 'comunidad T-Padel' },
    { file: 'src/app/(admin)/admin/settings/page.tsx', from: 'PSP Padel', to: 'T-Padel' },
    { file: 'src/app/(admin)/admin/settings/page.tsx', from: '"PSP"', to: '"T-Padel"' },
    { file: 'src/actions/admin-calendar.ts', from: '@local.psp', to: '@local.tpadel' }
];

replacements.forEach(r => {
    const fullPath = path.join(__dirname, '..', r.file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.split(r.from).join(r.to);
        fs.writeFileSync(fullPath, content);
    }
});
console.log('Reemplazos completados.');
