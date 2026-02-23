import prisma from './src/lib/prisma.js';

async function check() {
    const user = await prisma.user.findUnique({
        where: { email: 'yo@minegocio.com' }
    });
    console.log('USER_FOUND:', !!user);
}

check().catch(console.error).finally(() => prisma.$disconnect());
