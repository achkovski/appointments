/**
 * Slot Calculation and Public Booking Test Script
 * Tests available slots calculation with various scenarios
 * Run with: node test-slots.js
 */

const API_BASE = 'http://localhost:5000/api';

// Store test data
const timestamp = Date.now();
const testData = {
  user: {
    email: `slots-test-${timestamp}@example.com`,
    password: 'Test@1234',
    firstName: 'Slots',
    lastName: 'Tester',
  },
  token: null,
  businessId: null,
  businessSlug: null,
  serviceId: null,
  availabilityIds: [],
};

// Helper function to make API requests
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

// Get today's date and future dates
function getDateString(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// ============================
// SETUP TESTS
// ============================

async function setupTestBusiness() {
  console.log('\n🔧 SETUP: Creating test business with availability...');

  // Register user
  console.log('   Registering user...');
  const registerResult = await apiRequest('/auth/register', 'POST', testData.user, false);
  if (!registerResult.success) {
    console.log('   ❌ Registration failed');
    return false;
  }
  testData.token = registerResult.data.token;
  console.log('   ✅ User registered');

  // Create business
  console.log('   Creating business...');
  const businessData = {
    businessName: 'Slot Test Clinic',
    description: 'Test clinic for slot calculation',
    capacityMode: 'SINGLE',
    defaultSlotInterval: 30,
    autoConfirm: true,
  };

  const businessResult = await apiRequest('/businesses', 'POST', businessData);
  if (!businessResult.success) {
    console.log('   ❌ Business creation failed');
    return false;
  }
  testData.businessId = businessResult.data.business.id;
  testData.businessSlug = businessResult.data.business.slug;
  console.log('   ✅ Business created:', testData.businessSlug);

  // Create service
  console.log('   Creating service...');
  const serviceData = {
    businessId: testData.businessId,
    name: 'Consultation',
    description: '30 minute consultation',
    duration: 30,
    price: '50.00',
    isActive: true,
  };

  const serviceResult = await apiRequest('/services', 'POST', serviceData);
  if (!serviceResult.success) {
    console.log('   ❌ Service creation failed');
    return false;
  }
  testData.serviceId = serviceResult.data.service.id;
  console.log('   ✅ Service created');

  // Set up working hours (Monday-Friday, 9AM-5PM)
  console.log('   Setting up working hours (Mon-Fri, 9AM-5PM)...');
  const workingDays = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Friday
  ];

  for (const day of workingDays) {
    const result = await apiRequest(
      `/businesses/${testData.businessId}/availability`,
      'POST',
      day
    );
    if (result.success) {
      testData.availabilityIds.push(result.data.data.id);
    }
  }
  console.log('   ✅ Working hours configured');

  // Add lunch break to Monday
  console.log('   Adding lunch break (12:00-13:00)...');
  const breakResult = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}/breaks`,
    'POST',
    { breakStart: '12:00', breakEnd: '13:00' }
  );
  if (breakResult.success) {
    console.log('   ✅ Lunch break added');
  }

  // Add a special date (tomorrow - half day)
  console.log('   Adding special date (tomorrow - half day 9AM-12PM)...');
  const tomorrow = getDateString(1);
  const specialDateResult = await apiRequest(
    `/businesses/${testData.businessId}/special-dates`,
    'POST',
    {
      date: tomorrow,
      isAvailable: true,
      startTime: '09:00',
      endTime: '12:00',
      reason: 'Half Day',
    }
  );
  if (specialDateResult.success) {
    console.log('   ✅ Special date added');
  }

  console.log('   ✅ Setup complete!\n');
  return true;
}

// ============================
// PUBLIC ENDPOINT TESTS
// ============================

async function testGetBusinessBySlug() {
  console.log('\n🏢 Testing Get Business By Slug (Public)...');

  const result = await apiRequest(`/public/business/${testData.businessSlug}`, 'GET', null, false);

  if (result.success) {
    console.log('✅ Business retrieved successfully');
    console.log('   Business:', result.data.data.businessName);
    console.log('   Services:', result.data.data.services.length);
    result.data.data.services.forEach(s => {
      console.log(`     - ${s.name} (${s.duration} mins) - $${s.price || '0.00'}`);
    });
  } else {
    console.log('❌ Get business failed:', result.data.message);
  }

  return result.success;
}

async function testGetAvailableSlotsForToday() {
  console.log('\n📅 Testing Get Available Slots (Today)...');

  const today = getDateString(0);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = new Date(today).getDay();

  console.log(`   Date: ${today} (${dayNames[dayOfWeek]})`);

  const result = await apiRequest(
    '/public/available-slots',
    'POST',
    {
      businessSlug: testData.businessSlug,
      serviceId: testData.serviceId,
      date: today,
    },
    false
  );

  if (result.success) {
    const data = result.data.data;

    if (!data.available) {
      console.log(`⚠️  No slots available: ${data.reason || 'Business closed'}`);
      return true;
    }

    console.log('✅ Available slots calculated successfully');
    console.log(`   Working hours: ${data.workingHours.start} - ${data.workingHours.end}`);
    console.log(`   Service: ${data.service.name} (${data.service.duration} mins)`);
    console.log(`   Capacity mode: ${data.capacityMode}`);
    console.log(`   Breaks: ${data.breaks.length}`);
    data.breaks.forEach(b => {
      console.log(`     - ${b.start} - ${b.end}`);
    });
    console.log(`   Total available slots: ${data.totalSlots}`);

    if (data.totalSlots > 0) {
      console.log('   First 5 slots:');
      data.slots.slice(0, 5).forEach(slot => {
        console.log(`     - ${slot.startTime} - ${slot.endTime}`);
      });
    }
  } else {
    console.log('❌ Get slots failed:', result.data.message);
  }

  return result.success;
}

async function testGetAvailableSlotsForTomorrow() {
  console.log('\n📅 Testing Get Available Slots (Tomorrow - Special Date)...');

  const tomorrow = getDateString(1);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = new Date(tomorrow).getDay();

  console.log(`   Date: ${tomorrow} (${dayNames[dayOfWeek]}) - Special: Half Day 9AM-12PM`);

  const result = await apiRequest(
    '/public/available-slots',
    'POST',
    {
      businessSlug: testData.businessSlug,
      serviceId: testData.serviceId,
      date: tomorrow,
    },
    false
  );

  if (result.success) {
    const data = result.data.data;

    if (!data.available) {
      console.log(`⚠️  No slots available: ${data.reason || 'Business closed'}`);
      return true;
    }

    console.log('✅ Available slots calculated successfully (special date)');
    console.log(`   Working hours: ${data.workingHours.start} - ${data.workingHours.end} (Custom)`);
    console.log(`   Total available slots: ${data.totalSlots}`);

    if (data.totalSlots > 0) {
      console.log('   All slots:');
      data.slots.forEach(slot => {
        console.log(`     - ${slot.startTime} - ${slot.endTime}`);
      });
    }
  } else {
    console.log('❌ Get slots failed:', result.data.message);
  }

  return result.success;
}

async function testGetAvailableSlotsForRange() {
  console.log('\n📆 Testing Get Available Slots (7-day Range)...');

  const startDate = getDateString(0);
  const endDate = getDateString(6);

  console.log(`   Range: ${startDate} to ${endDate}`);

  const result = await apiRequest(
    '/public/available-slots-range',
    'POST',
    {
      businessSlug: testData.businessSlug,
      serviceId: testData.serviceId,
      startDate,
      endDate,
    },
    false
  );

  if (result.success) {
    console.log('✅ Slot range calculated successfully');
    console.log(`   Total days: ${result.data.totalDays}`);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    result.data.data.forEach(day => {
      const date = new Date(day.date);
      const dayName = dayNames[date.getDay()];

      if (day.available) {
        console.log(`   ${day.date} (${dayName}): ${day.totalSlots} slots available`);
      } else {
        console.log(`   ${day.date} (${dayName}): Closed - ${day.reason || 'Not available'}`);
      }
    });
  } else {
    console.log('❌ Get slot range failed:', result.data.message);
  }

  return result.success;
}

async function testPastDateValidation() {
  console.log('\n⚠️  Testing Past Date Validation...');

  const pastDate = getDateString(-5); // 5 days ago

  const result = await apiRequest(
    '/public/available-slots',
    'POST',
    {
      businessSlug: testData.businessSlug,
      serviceId: testData.serviceId,
      date: pastDate,
    },
    false
  );

  if (result.success) {
    const data = result.data.data;

    if (!data.available && data.reason === 'Date is in the past') {
      console.log('✅ Correctly rejected past date');
      console.log(`   Date: ${pastDate} - Reason: ${data.reason}`);
      return true;
    } else {
      console.log('❌ Should have rejected past date');
      return false;
    }
  } else {
    console.log('❌ Request failed:', result.data.message);
    return false;
  }
}

async function testInvalidBusinessSlug() {
  console.log('\n⚠️  Testing Invalid Business Slug...');

  const result = await apiRequest(
    '/public/available-slots',
    'POST',
    {
      businessSlug: 'non-existent-business-12345',
      serviceId: testData.serviceId,
      date: getDateString(1),
    },
    false
  );

  if (!result.success && result.status === 404) {
    console.log('✅ Correctly rejected invalid business slug');
    return true;
  } else {
    console.log('❌ Should have returned 404 for invalid slug');
    return false;
  }
}

// ============================
// RUN ALL TESTS
// ============================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 SLOT CALCULATION & PUBLIC BOOKING TESTS');
  console.log('═══════════════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  // Setup
  const setupSuccess = await setupTestBusiness();
  if (!setupSuccess) {
    console.log('\n❌ Setup failed. Cannot continue tests.');
    return;
  }

  const tests = [
    { name: 'Get Business By Slug', fn: testGetBusinessBySlug },
    { name: 'Get Available Slots (Today)', fn: testGetAvailableSlotsForToday },
    { name: 'Get Available Slots (Tomorrow - Special Date)', fn: testGetAvailableSlotsForTomorrow },
    { name: 'Get Available Slots (7-day Range)', fn: testGetAvailableSlotsForRange },
    { name: 'Past Date Validation', fn: testPastDateValidation },
    { name: 'Invalid Business Slug', fn: testInvalidBusinessSlug },
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
