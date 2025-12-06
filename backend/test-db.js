import prisma from './src/config/database.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    const users = await prisma.user.findMany();
    console.log('Successfully connected! Found', users.length, 'users');
  } catch (error) {
    console.error('Database error:', error);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testDatabase();
