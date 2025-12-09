/**
 * Test script to debug route loading
 */

console.log('Starting route loading test...\n');

try {
  console.log('1. Importing express...');
  const express = await import('express');
  console.log('   ✅ Express imported\n');

  console.log('2. Importing database...');
  const db = await import('./src/config/database.js');
  console.log('   ✅ Database imported\n');

  console.log('3. Importing publicBookingController...');
  const controller = await import('./src/controllers/publicBookingController.js');
  console.log('   ✅ Controller imported');
  console.log('   Exports:', Object.keys(controller));
  console.log();

  console.log('4. Importing publicBookingRoutes...');
  const routes = await import('./src/routes/publicBookingRoutes.js');
  console.log('   ✅ Routes imported');
  console.log('   Default export type:', typeof routes.default);
  console.log();

  console.log('5. Creating test Express app...');
  const app = express.default();
  app.use(express.default.json());

  console.log('6. Registering routes...');
  app.use('/api/public', routes.default);
  console.log('   ✅ Routes registered\n');

  console.log('7. Testing route registration...');
  const PORT = 5555;
  const server = app.listen(PORT, () => {
    console.log(`   ✅ Test server started on port ${PORT}\n`);

    console.log('8. Testing public endpoint with fetch...');
    fetch(`http://localhost:${PORT}/api/public/business/test-slug`)
      .then(res => res.json())
      .then(data => {
        console.log('   Response:', data);
        if (data.message === 'Business not found' || data.success === false) {
          console.log('   ✅ Route is working! (Expected 404 for non-existent business)\n');
        } else {
          console.log('   ⚠️  Unexpected response\n');
        }
      })
      .catch(error => {
        console.log('   ❌ Fetch error:', error.message);
      })
      .finally(() => {
        server.close(() => {
          console.log('✅ All tests passed! Routes work correctly.');
          process.exit(0);
        });
      });
  });

  setTimeout(() => {
    console.log('❌ Test timeout');
    server.close();
    process.exit(1);
  }, 5000);
} catch (error) {
  console.error('\n❌ Error during route loading:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
}
