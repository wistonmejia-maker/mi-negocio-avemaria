import prisma from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function create() {
    const passwordHash = await bcrypt.hash('Avemaria123!', 12);
    const user = await prisma.user.upsert({
        where: { email: 'yo@minegocio.com' },
        update: { passwordHash },
        create: {
            email: 'yo@minegocio.com',
            passwordHash,
            name: 'Mi Nombre',
            businessName: 'Mi Negocio AVEMARÍA'
        }
    });
    console.log('USER_CREATED_OR_UPDATED:', user.email);
}

create().catch(console.error).finally(() => prisma.$disconnect());
