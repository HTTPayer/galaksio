import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJob() {
  const job = await prisma.userJob.findFirst({
    where: { brokerJobId: 'f5e6613e-3ae8-4057-9474-d9560e772d71' }
  });
  
  console.log('\n=== JOB DATA ===');
  console.log('Status:', job?.status);
  console.log('Exit Code:', job?.exitCode);
  console.log('Execution Time:', job?.executionTimeMs);
  console.log('\n=== STDOUT ===');
  console.log(job?.stdout || 'NULL');
  console.log('\n=== RAW RESULT ===');
  console.log(JSON.stringify(job?.rawResult, null, 2));
  console.log('\n=== RAW STATUS ===');
  console.log(JSON.stringify(job?.rawStatus, null, 2));
  
  await prisma.$disconnect();
}

checkJob().catch(console.error);
