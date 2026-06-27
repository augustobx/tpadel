import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

function parseSqlValues(sqlText: string) {
    const records: string[][] = [];
    let inString = false, escape = false, currentRecord: string[] = [], currentValue = '', inTuple = false;
    for (let i = 0; i < sqlText.length; i++) {
        const char = sqlText[i];
        if (!inTuple) { if (char === '(') inTuple = true; continue; }
        if (escape) { currentValue += char; escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === "'") {
            if (inString && sqlText[i+1] === "'") { currentValue += "'"; i++; continue; }
            inString = !inString; continue;
        }
        if (inString) currentValue += char;
        else {
            if (char === ',') { currentRecord.push(currentValue.trim()); currentValue = ''; }
            else if (char === ')') { currentRecord.push(currentValue.trim()); records.push(currentRecord); currentRecord = []; currentValue = ''; inTuple = false; }
            else currentValue += char;
        }
    }
    return records;
}

function extractAllRecords(sqlContent: string, tableName: string) {
    const regex = new RegExp(`INSERT INTO \`${tableName}\`[^\\n]*VALUES\\s*([\\s\\S]*?);`, 'g');
    let allRecords: string[][] = [];
    let match;
    while ((match = regex.exec(sqlContent)) !== null) {
        if (match[1]) {
            allRecords = allRecords.concat(parseSqlValues(match[1]));
        }
    }
    return allRecords;
}

function addMinutes(timeStr: string, minutes: number) {
    if (!timeStr) return "00:00";
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr || '0', 10), m = parseInt(mStr || '0', 10) + minutes;
    while (m >= 60) { h += 1; m -= 60; }
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

async function main() {
    console.log('Iniciando migración masiva...');
    const sqlPath = path.join(process.cwd(), 'dbbkpd', 'c2801249_pspv2.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('No se encontró archivo SQL.');
        process.exit(1);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    const oldCourtIdToNewId = new Map<string, string>();
    const userPhoneToNewId = new Map<string, string>();

    // 1. ADMIMS -> Users
    console.log('--- Migrando Administradores ---');
    const adminRecords = extractAllRecords(sqlContent, 'admins');
    let adminsCount = 0;
    for (const record of adminRecords) {
        const username = record[1];
        if (!username) continue;
        const exists = await prisma.user.findFirst({ where: { name: username, role: 'ADMIN' } });
        if (!exists) {
            await prisma.user.create({
                data: {
                    name: username,
                    email: `${username.toLowerCase().replace(/\s/g, '')}@admin.com`,
                    phone: `0000${Math.floor(Math.random()*10000)}`,
                    role: 'ADMIN',
                    // Asumimos que tendran que blanquear password o usar el existente si usan bcrypt
                }
            });
            adminsCount++;
        }
    }
    console.log(`✅ Migrados ${adminsCount} administradores nuevos.`);

    // 2. COURTS
    console.log('--- Vinculando Canchas ---');
    const courtRecords = extractAllRecords(sqlContent, 'courts');
    for (const record of courtRecords) {
        const oldId = record[0];
        const name = record[2] || `Cancha ${oldId}`;
        
        let court = await prisma.court.findFirst({ where: { name: name } });
        if (!court) {
            court = await prisma.court.create({
                data: { name, isActive: true, sport: 'Padel', surface: 'Piso Cemento' }
            });
        }
        oldCourtIdToNewId.set(oldId, court.id);

        const hours = await prisma.businessHour.findFirst({ where: { courtId: court.id } });
        if (!hours) {
            for (let day = 0; day <= 6; day++) {
                await prisma.businessHour.create({
                    data: { courtId: court.id, dayOfWeek: day, openTime: '08:00', closeTime: '23:30' }
                });
            }
        }
    }

    // 3. BOOKINGS (Usuarios + Reservas)
    console.log('--- Migrando Reservas Completas ---');
    const bookingRecords = extractAllRecords(sqlContent, 'bookings');
    console.log(`Encontradas ${bookingRecords.length} reservas en el backup. Creando usuarios...`);
    
    // Crear usuarios de reservas
    for (const record of bookingRecords) {
        let phone = record[5] ? record[5].replace(/\D/g, '') : '0000000000';
        if (!phone) phone = '0000000000';
        if (!userPhoneToNewId.has(phone)) {
            let user = await prisma.user.findFirst({ where: { phone } });
            if (!user) {
                user = await prisma.user.create({
                    data: { name: record[4] || 'Usuario', phone, email: `user_${phone}_${Math.floor(Math.random()*10000)}@migrated.com`, role: 'PLAYER' }
                });
            }
            userPhoneToNewId.set(phone, user.id);
        }
    }

    // Insertar reservas (en lotes pequeños para no saturar SQLite/MariaDB)
    let bookingCount = 0;
    for (const record of bookingRecords) {
        const courtId = oldCourtIdToNewId.get(record[1]);
        if (!courtId) continue;
        let phone = record[5] ? record[5].replace(/\D/g, '') : '0000000000';
        if (!phone) phone = '0000000000';
        const userId = userPhoneToNewId.get(phone);

        const startDateTime = new Date(`${record[2]}T${record[3]}`);
        const statusStr = record[8]?.toLowerCase();
        let status: any = 'PENDING';
        if (statusStr === 'confirmed' || statusStr === 'finalized') status = 'CONFIRMED';
        else if (statusStr === 'rejected') status = 'CANCELLED';

        await prisma.booking.create({
            data: { courtId, userId, startTime: startDateTime, endTime: new Date(startDateTime.getTime() + 90 * 60000), status, totalAmount: record[6] !== 'NULL' && record[6] ? parseFloat(record[6]) : 0 }
        });
        bookingCount++;
        if (bookingCount % 500 === 0) console.log(`  Procesadas ${bookingCount} reservas...`);
    }
    console.log(`✅ Total migradas: ${bookingCount} reservas.`);

    // 4. FIXED RESERVATIONS
    console.log('--- Migrando Turnos Fijos ---');
    const fixedRecords = extractAllRecords(sqlContent, 'fixed_reservations');
    let fixedCount = 0;
    for (const record of fixedRecords) {
        const courtId = oldCourtIdToNewId.get(record[1]);
        if (!courtId) continue;
        let phone = record[5] ? record[5].replace(/\D/g, '') : '0000000000';
        if (!phone) phone = '0000000000';
        let userId = userPhoneToNewId.get(phone);
        if (!userId) {
            const user = await prisma.user.create({ data: { name: record[4] || 'Fijo', phone, email: `fijo_${phone}_${Math.floor(Math.random()*10000)}@migrated.com`, role: 'PLAYER' } });
            userId = user.id;
            userPhoneToNewId.set(phone, userId);
        }
        await prisma.fixedBooking.create({
            data: { courtId, userId, dayOfWeek: parseInt(record[2], 10), startTime: record[3].substring(0, 5), endTime: addMinutes(record[3].substring(0, 5), 90), startDate: new Date('2020-01-01'), endDate: new Date('2030-01-01'), isActive: record[6] === '1' }
        });
        fixedCount++;
    }
    console.log(`✅ Migrados ${fixedCount} turnos fijos.`);

    // 5. BLACKOUTS
    console.log('--- Migrando Bloqueos de Cancha ---');
    const blackoutRecords = extractAllRecords(sqlContent, 'blackouts');
    let blackoutCount = 0;
    for (const record of blackoutRecords) {
        const courtId = oldCourtIdToNewId.get(record[1]);
        if (!courtId) continue;
        await prisma.courtBlock.create({
            data: { courtId, startTime: new Date(record[2]), endTime: new Date(record[3]), reason: record[4] !== 'NULL' ? record[4] : 'Bloqueado' }
        });
        blackoutCount++;
    }
    console.log(`✅ Migrados ${blackoutCount} bloqueos.`);

    // 6. EXPENSES
    console.log('--- Migrando Gastos ---');
    const expenseRecords = extractAllRecords(sqlContent, 'expenses');
    let expenseCount = 0;
    for (const record of expenseRecords) {
        await prisma.expense.create({
            data: { date: new Date(record[1]), description: record[2], amount: record[3] !== 'NULL' && record[3] ? parseFloat(record[3]) : 0 }
        });
        expenseCount++;
    }
    console.log(`✅ Migrados ${expenseCount} gastos.`);

    console.log('¡MIGRACIÓN COMPLETA 100% EXITOSA!');
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
