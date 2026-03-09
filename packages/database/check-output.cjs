const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({
    select: { id: true, email: true, aiSettings: true }
}).then(users => {
    users.forEach(u => {
        console.log(`User: ${u.email} | ID: ${u.id}`);
        console.log(`  aiSettings:`, JSON.stringify(u.aiSettings));
    });
}).finally(() => p.$disconnect());
