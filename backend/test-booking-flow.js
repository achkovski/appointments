/**
 * Complete Booking Flow Test
 * Tests the entire guest booking process from start to finish
 * Run with: node test-booking-flow.js
 */

const API_BASE = 'http://localhost:5000/api';

// Store test data
const timestamp = Date.now();
const testData = {
  businessOwner: {
    email: `booking-owner-${timestamp}@example.com`,
    password: 'Test@1234',
    firstName: 'Business',
    lastName: 'Owner',
  },
  client: {
    firstName: 'John',
    lastName: 'Doe',
    email: `client-${timestamp}@example.com`,
    phone: '+1234567890',
    notes: 'First time client'
  },
  token: null,
  businessId: null,
  businessSlug: null,
  serviceId: null,
  appointmentId: null,
  confirmationToken: null
};

// Helper function
async function apiRequest(endpoint, method = 'GET', body = null, useToken = true) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (useToken && testData.token) {
    options.headers['Authorization'] = `Bearer ${testData.token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return {
      status: response.status,
      data,
      success: response.ok,
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false,
    };
  }
}

function getDateString(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// ============================
// SETUP: Business Owner
// ============================

async function setupBusiness() {
  console.log('\n🔧 SETUP: Creating business with services and availability...\n');

  // Register business owner
  console.log('1. Registering business owner...');
  const registerResult = await apiRequest('/auth/register', 'POST', testData.businessOwner, false);
  if (!registerResult.success) {
    console.log('   ❌ Failed');
    return false;
  }
  testData.token = registerResult.data.token;
  console.log('   ✅ Registered\n');

  // Create business
  console.log('2. Creating business...');
  const businessData = {
    businessName: 'Test Booking Clinic',
    description: 'Full service medical clinic',
    capacityMode: 'SINGLE',
    autoConfirm: true,
    requireEmailConfirmation: false,
  };
  const businessResult = await apiRequest('/businesses', 'POST', businessData);
  if (!businessResult.success) {
    console.log('   ❌ Failed');
    return false;
  }
  testData.businessId = businessResult.data.business.id;
  testData.businessSlug = businessResult.data.business.slug;
  console.log(`   ✅ Created: ${testData.businessSlug}\n`);

  // Create service
  console.log('3. Creating service...');
  const serviceData = {
    businessId: testData.businessId,
    name: 'General Checkup',
    description: '30 minute checkup',
    duration: 30,
    price: '75.00',
    isActive: true,
  };
  const serviceResult = await apiRequest('/services', 'POST', serviceData);
  if (!serviceResult.success) {
    console.log('   ❌ Failed');
    return false;
  }
  testData.serviceId = serviceResult.data.service.id;
  console.log('   ✅ Service created\n');

  // Set working hours (Mon-Fri, 9AM-5PM)
  console.log('4. Setting working hours...');
  const workingDays = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
  ];

  let success = true;
  for (const day of workingDays) {
    const result = await apiRequest(
      `/businesses/${testData.businessId}/availability`,
      'POST',
      day
    );
    if (!result.success) {
      success = false;
      break;
    }
  }

  if (!success) {
    console.log('   ❌ Failed');
    return false;
  }
  console.log('   ✅ Working hours configured\n');

  console.log('✅ Setup complete!\n');
  return true;
}

// ============================
// CLIENT BOOKING FLOW
// ============================

async function testGetBusinessInfo() {
  console.log('\n📋 Step 1: Client views business information (Public)...');

  const result = await apiRequest(`/public/business/${testData.businessSlug}`, 'GET', null, false);

  if (result.success) {
    console.log('✅ Business info retrieved');
    console.log(`   Business: ${result.data.data.businessName}`);
    console.log(`   Services: ${result.data.data.services.length}`);
    result.data.data.services.forEach(s => {
      console.log(`     - ${s.name} ($${s.price}) - ${s.duration} mins`);
    });
    return true;
  } else {
    console.log('❌ Failed:', result.data.message);
    return false;
  }
}

async function testViewAvailableSlots() {
  console.log('\n📅 Step 2: Client checks available slots...');

  const tomorrow = getDateString(1);

  const result = await apiRequest(
    '/public/available-slots',
    'POST',
    {
      businessSlug: testData.businessSlug,
      serviceId: testData.serviceId,
      date: tomorrow
    },
    false
  );

  if (result.success && result.data.data.available) {
    console.log('✅ Available slots retrieved');
    console.log(`   Date: ${tomorrow}`);
    console.log(`   Total slots: ${result.data.data.totalSlots}`);
    console.log('   First 5 slots:');
    result.data.data.slots.slice(0, 5).forEach(slot => {
      console.log(`     - ${slot.startTime} - ${slot.endTime}`);
    });
    return true;
  } else {
    console.log('❌ Failed or no slots available');
    return false;
  }
}

async function testBookAppointment() {
  console.log('\n📝 Step 3: Client books an appointment...');

  const tomorrow = getDateString(1);

  const bookingData = {
    businessSlug: testData.businessSlug,
    serviceId: testData.serviceId,
    appointmentDate: tomorrow,
    startTime: '10:00',
    clientFirstName: testData.client.firstName,
    clientLastName: testData.client.lastName,
    clientEmail: testData.client.email,
    clientPhone: testData.client.phone,
    clientNotes: testData.client.notes
  };

  const result = await apiRequest('/public/book', 'POST', bookingData, false);

  if (result.success) {
    console.log('✅ Appointment booked successfully!');
    console.log(`   Status: ${result.data.appointment.status}`);
    console.log(`   Date: ${result.data.appointment.appointmentDate}`);
    console.log(`   Time: ${result.data.appointment.startTime} - ${result.data.appointment.endTime}`);
    console.log(`   Service: ${result.data.appointment.serviceName}`);
    testData.appointmentId = result.data.appointment.id;
    return true;
  } else {
    console.log('❌ Booking failed:', result.data.message);
    return false;
  }
}

async function testDoubleBookingPrevention() {
  console.log('\n🚫 Step 4: Testing double booking prevention...');

  const tomorrow = getDateString(1);

  const bookingData = {
    businessSlug: testData.businessSlug,
    serviceId: testData.serviceId,
    appointmentDate: tomorrow,
    startTime: '10:00', // Same time as previous booking
    clientFirstName: 'Jane',
    clientLastName: 'Smith',
    clientEmail: `another-client-${timestamp}@example.com`,
    clientPhone: '+19876543210'
  };

  const result = await apiRequest('/public/book', 'POST', bookingData, false);

  if (!result.success && result.status === 400) {
    console.log('✅ Correctly prevented double booking');
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log('❌ Should have prevented double booking');
    return false;
  }
}

async function testBusinessViewAppointments() {
  console.log('\n👔 Step 5: Business owner views appointments...');

  const result = await apiRequest(`/appointments/business/${testData.businessId}`, 'GET');

  if (result.success) {
    console.log('✅ Appointments retrieved');
    console.log(`   Total appointments: ${result.data.total}`);
    result.data.data.forEach((apt, i) => {
      console.log(`   ${i + 1}. ${apt.clientFirstName} ${apt.clientLastName}`);
      console.log(`      Date: ${apt.appointmentDate} at ${apt.startTime}`);
      console.log(`      Status: ${apt.status}`);
      console.log(`      Email confirmed: ${apt.isEmailConfirmed}`);
    });
    return true;
  } else {
    console.log('❌ Failed:', result.data.message);
    return false;
  }
}

async function testUpdateAppointmentStatus() {
  console.log('\n✏️  Step 6: Business owner updates appointment status...');

  if (!testData.appointmentId) {
    console.log('❌ No appointment ID');
    return false;
  }

  const result = await apiRequest(
    `/appointments/${testData.appointmentId}/status`,
    'PUT',
    { status: 'COMPLETED' }
  );

  if (result.success) {
    console.log('✅ Appointment status updated');
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    console.log('❌ Failed:', result.data.message);
    return false;
  }
}

async function testFilterAppointments() {
  console.log('\n🔍 Step 7: Business owner filters appointments by status...');

  const result = await apiRequest(
    `/appointments/business/${testData.businessId}?status=COMPLETED`,
    'GET'
  );

  if (result.success) {
    console.log('✅ Filtered appointments retrieved');
    console.log(`   Completed appointments: ${result.data.total}`);
    return true;
  } else {
    console.log('❌ Failed:', result.data.message);
    return false;
  }
}

// ============================
// RUN ALL TESTS
// ============================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 COMPLETE BOOKING FLOW TESTS');
  console.log('═══════════════════════════════════════════════════');

  // Setup
  const setupSuccess = await setupBusiness();
  if (!setupSuccess) {
    console.log('\n❌ Setup failed. Cannot continue.\n');
    return;
  }

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Get Business Info', fn: testGetBusinessInfo },
    { name: 'View Available Slots', fn: testViewAvailableSlots },
    { name: 'Book Appointment', fn: testBookAppointment },
    { name: 'Double Booking Prevention', fn: testDoubleBookingPrevention },
    { name: 'Business View Appointments', fn: testBusinessViewAppointments },
    { name: 'Update Appointment Status', fn: testUpdateAppointmentStatus },
    { name: 'Filter Appointments', fn: testFilterAppointments },
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`\n❌ ${test.name} threw error:`, error.message);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════\n');
}

// Run the tests
runAllTests().catch(console.error);
