import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Aseguramos que el protocolo sea el correcto para el adapter sin tocar el .env original
const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');

// Modificamos el connection string para inyectar configuraciones de resiliencia
function getConnectionStringWithPoolOpts() {
  try {
    const url = new URL(connectionString);
    
    // En hosting compartido (DonWeb), la base de datos tiene límites muy estrictos de conexiones
    // y mata las conexiones inactivas rápidamente.
    // Next.js usa ~11 workers durante 'npm run build', lo que agota las conexiones si el límite es alto.
    const isBuildPhase = process.env.npm_lifecycle_event === 'build';
    
    if (!url.searchParams.has('connectionLimit')) {
      // 1 conexión por proceso durante build para no saturar DB. Max 3 en producción normal.
      url.searchParams.set('connectionLimit', isBuildPhase ? '1' : '3');
    }
    if (!url.searchParams.has('acquireTimeout')) {
      url.searchParams.set('acquireTimeout', '30000'); // 30s de paciencia (hostings compartidos pueden ser lentos)
    }
    if (!url.searchParams.has('idleTimeout')) {
      url.searchParams.set('idleTimeout', '30'); // Liberar idle connections a los 30s
    }
    if (!url.searchParams.has('minDelayValidation')) {
      url.searchParams.set('minDelayValidation', '500'); 
    }
    if (!url.searchParams.has('resetAfterUse')) {
      url.searchParams.set('resetAfterUse', 'true');
    }
    
    return url.toString();
  } catch {
    return connectionString;
  }
}

// El adapter ahora recibe el string de conexión con los parámetros de resiliencia de MariaDB
const adapter = new PrismaMariaDb(getConnectionStringWithPoolOpts());

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;