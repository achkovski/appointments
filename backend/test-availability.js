/**
 * Availability Management Endpoints Test Script
 * Tests working hours, breaks, and special dates functionality
 * Run with: node test-availability.js
 */

const API_BASE = 'http://localhost:5000/api';

// Store test data
const testData = {
  user: {
    email: 'availability-test@example.com',
    password: 'Test@1234',
    firstName: 'Availability',
    lastName: 'Tester',
  },
  token: null,
  businessId: null,
  availabilityIds: [],
  breakIds: [],
  specialDateIds: [],
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

// ============================
// SETUP TESTS
// ============================

async function testRegisterUser() {
  console.log('\n📝 Testing User Registration...');
  const result = await apiRequest('/auth/register', 'POST', testData.user, false);

  if (result.success) {
    console.log('✅ User registered successfully');
    testData.token = result.data.token;
  } else {
    console.log('❌ Registration failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testCreateBusiness() {
  console.log('\n🏢 Testing Create Business...');
  const businessData = {
    businessName: 'Availability Test Clinic',
    description: 'Test clinic for availability testing',
    address: '456 Test Street',
    phone: '+1234567890',
    email: 'test@clinic.com',
    capacityMode: 'SINGLE',
    defaultSlotInterval: 30,
    autoConfirm: true,
  };

  const result = await apiRequest('/businesses', 'POST', businessData);

  if (result.success) {
    console.log('✅ Business created successfully');
    console.log('   Business ID:', result.data.business.id);
    testData.businessId = result.data.business.id;
  } else {
    console.log('❌ Create business failed:', result.data.message || result.data.error);
  }

  return result.success;
}

// ============================
// AVAILABILITY (Working Hours) TESTS
// ============================

async function testCreateAvailability() {
  console.log('\n⏰ Testing Create Availability (Working Hours)...');

  // Create Monday availability (9:00 AM - 5:00 PM)
  const monday = {
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability`,
    'POST',
    monday
  );

  if (result.success) {
    console.log('✅ Availability created successfully');
    console.log('   Day:', 'Monday (1)');
    console.log('   Hours:', '09:00 - 17:00');
    testData.availabilityIds.push(result.data.data.id);
  } else {
    console.log('❌ Create availability failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testCreateMultipleAvailabilities() {
  console.log('\n⏰ Testing Create Multiple Availabilities...');

  const schedules = [
    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Tuesday
    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Wednesday
    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true }, // Thursday
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', isAvailable: true }, // Friday (half day)
    { dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isAvailable: false }, // Sunday (closed)
  ];

  let allSuccess = true;

  for (const schedule of schedules) {
    const result = await apiRequest(
      `/businesses/${testData.businessId}/availability`,
      'POST',
      schedule
    );

    if (result.success) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`✅ ${dayNames[schedule.dayOfWeek]}: ${schedule.startTime} - ${schedule.endTime} (Available: ${schedule.isAvailable})`);
      testData.availabilityIds.push(result.data.data.id);
    } else {
      console.log('❌ Failed to create availability:', result.data.message || result.data.error);
      allSuccess = false;
    }
  }

  return allSuccess;
}

async function testGetAvailability() {
  console.log('\n📋 Testing Get All Availability Rules...');

  const result = await apiRequest(`/businesses/${testData.businessId}/availability`);

  if (result.success) {
    console.log('✅ Retrieved availability rules successfully');
    console.log(`   Total rules: ${result.data.data.length}`);
    result.data.data.forEach(rule => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      console.log(`   - ${dayNames[rule.dayOfWeek]}: ${rule.startTime} - ${rule.endTime} (Available: ${rule.isAvailable})`);
    });
  } else {
    console.log('❌ Get availability failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testUpdateAvailability() {
  console.log('\n✏️ Testing Update Availability...');

  if (testData.availabilityIds.length === 0) {
    console.log('❌ No availability IDs to update');
    return false;
  }

  const updates = {
    startTime: '08:00',
    endTime: '18:00',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}`,
    'PUT',
    updates
  );

  if (result.success) {
    console.log('✅ Availability updated successfully');
    console.log('   New hours:', '08:00 - 18:00');
  } else {
    console.log('❌ Update availability failed:', result.data.message || result.data.error);
  }

  return result.success;
}

// ============================
// BREAKS TESTS
// ============================

async function testCreateBreak() {
  console.log('\n☕ Testing Create Break...');

  if (testData.availabilityIds.length === 0) {
    console.log('❌ No availability IDs to add breaks to');
    return false;
  }

  const lunchBreak = {
    breakStart: '12:00',
    breakEnd: '13:00',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}/breaks`,
    'POST',
    lunchBreak
  );

  if (result.success) {
    console.log('✅ Break created successfully');
    console.log('   Break time:', '12:00 - 13:00 (Lunch)');
    testData.breakIds.push(result.data.data.id);
  } else {
    console.log('❌ Create break failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testGetBreaks() {
  console.log('\n📋 Testing Get Breaks...');

  if (testData.availabilityIds.length === 0) {
    console.log('❌ No availability IDs');
    return false;
  }

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}/breaks`
  );

  if (result.success) {
    console.log('✅ Retrieved breaks successfully');
    console.log(`   Total breaks: ${result.data.data.length}`);
    result.data.data.forEach(breakItem => {
      console.log(`   - ${breakItem.breakStart} - ${breakItem.breakEnd}`);
    });
  } else {
    console.log('❌ Get breaks failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testUpdateBreak() {
  console.log('\n✏️ Testing Update Break...');

  if (testData.breakIds.length === 0) {
    console.log('❌ No break IDs to update');
    return false;
  }

  const updates = {
    breakStart: '12:30',
    breakEnd: '13:30',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}/breaks/${testData.breakIds[0]}`,
    'PUT',
    updates
  );

  if (result.success) {
    console.log('✅ Break updated successfully');
    console.log('   New break time:', '12:30 - 13:30');
  } else {
    console.log('❌ Update break failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testDeleteBreak() {
  console.log('\n🗑️ Testing Delete Break...');

  if (testData.breakIds.length === 0) {
    console.log('❌ No break IDs to delete');
    return false;
  }

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}/breaks/${testData.breakIds[0]}`,
    'DELETE'
  );

  if (result.success) {
    console.log('✅ Break deleted successfully');
  } else {
    console.log('❌ Delete break failed:', result.data.message || result.data.error);
  }

  return result.success;
}

// ============================
// SPECIAL DATES TESTS
// ============================

async function testCreateSpecialDate() {
  console.log('\n📅 Testing Create Special Date (Holiday)...');

  // Create a holiday (closed)
  const holiday = {
    date: '2025-12-25',
    isAvailable: false,
    reason: 'Christmas Day - Closed',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/special-dates`,
    'POST',
    holiday
  );

  if (result.success) {
    console.log('✅ Special date created successfully');
    console.log('   Date:', '2025-12-25');
    console.log('   Status:', 'Closed');
    console.log('   Reason:', 'Christmas Day');
    testData.specialDateIds.push(result.data.data.id);
  } else {
    console.log('❌ Create special date failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testCreateSpecialDateWithCustomHours() {
  console.log('\n📅 Testing Create Special Date (Custom Hours)...');

  // Create a special date with custom hours
  const customHours = {
    date: '2025-12-24',
    isAvailable: true,
    startTime: '09:00',
    endTime: '12:00',
    reason: 'Christmas Eve - Half Day',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/special-dates`,
    'POST',
    customHours
  );

  if (result.success) {
    console.log('✅ Special date with custom hours created successfully');
    console.log('   Date:', '2025-12-24');
    console.log('   Hours:', '09:00 - 12:00');
    console.log('   Reason:', 'Christmas Eve - Half Day');
    testData.specialDateIds.push(result.data.data.id);
  } else {
    console.log('❌ Create special date failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testGetSpecialDates() {
  console.log('\n📋 Testing Get All Special Dates...');

  const result = await apiRequest(`/businesses/${testData.businessId}/special-dates`);

  if (result.success) {
    console.log('✅ Retrieved special dates successfully');
    console.log(`   Total special dates: ${result.data.data.length}`);
    result.data.data.forEach(date => {
      console.log(`   - ${date.date}: ${date.isAvailable ? 'Open' : 'Closed'} ${date.reason ? `(${date.reason})` : ''}`);
      if (date.startTime && date.endTime) {
        console.log(`     Hours: ${date.startTime} - ${date.endTime}`);
      }
    });
  } else {
    console.log('❌ Get special dates failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testGetSpecialDatesWithDateRange() {
  console.log('\n📋 Testing Get Special Dates with Date Range...');

  const result = await apiRequest(
    `/businesses/${testData.businessId}/special-dates?from=2025-12-01&to=2025-12-31`
  );

  if (result.success) {
    console.log('✅ Retrieved special dates with date range successfully');
    console.log('   Date range: 2025-12-01 to 2025-12-31');
    console.log(`   Results: ${result.data.data.length} dates`);
  } else {
    console.log('❌ Get special dates with range failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testUpdateSpecialDate() {
  console.log('\n✏️ Testing Update Special Date...');

  if (testData.specialDateIds.length === 0) {
    console.log('❌ No special date IDs to update');
    return false;
  }

  const updates = {
    reason: 'Christmas Day - Office Closed',
  };

  const result = await apiRequest(
    `/businesses/${testData.businessId}/special-dates/${testData.specialDateIds[0]}`,
    'PUT',
    updates
  );

  if (result.success) {
    console.log('✅ Special date updated successfully');
    console.log('   New reason:', 'Christmas Day - Office Closed');
  } else {
    console.log('❌ Update special date failed:', result.data.message || result.data.error);
  }

  return result.success;
}

async function testDeleteSpecialDate() {
  console.log('\n🗑️ Testing Delete Special Date...');

  if (testData.specialDateIds.length === 0) {
    console.log('❌ No special date IDs to delete');
    return false;
  }

  const result = await apiRequest(
    `/businesses/${testData.businessId}/special-dates/${testData.specialDateIds[0]}`,
    'DELETE'
  );

  if (result.success) {
    console.log('✅ Special date deleted successfully');
  } else {
    console.log('❌ Delete special date failed:', result.data.message || result.data.error);
  }

  return result.success;
}

// ============================
// VALIDATION TESTS
// ============================

async function testValidationErrors() {
  console.log('\n⚠️ Testing Validation Errors...');

  let passedTests = 0;
  let totalTests = 0;

  // Test invalid dayOfWeek
  totalTests++;
  console.log('\n   Testing invalid dayOfWeek (7)...');
  const invalidDay = await apiRequest(
    `/businesses/${testData.businessId}/availability`,
    'POST',
    { dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }
  );
  if (!invalidDay.success && invalidDay.status === 400) {
    console.log('   ✅ Correctly rejected invalid dayOfWeek');
    passedTests++;
  } else {
    console.log('   ❌ Should have rejected invalid dayOfWeek');
  }

  // Test invalid time format
  totalTests++;
  console.log('\n   Testing invalid time format...');
  const invalidTime = await apiRequest(
    `/businesses/${testData.businessId}/availability`,
    'POST',
    { dayOfWeek: 1, startTime: '25:00', endTime: '17:00' }
  );
  if (!invalidTime.success && invalidTime.status === 400) {
    console.log('   ✅ Correctly rejected invalid time format');
    passedTests++;
  } else {
    console.log('   ❌ Should have rejected invalid time format');
  }

  // Test startTime >= endTime
  totalTests++;
  console.log('\n   Testing startTime >= endTime...');
  const invalidTimeRange = await apiRequest(
    `/businesses/${testData.businessId}/availability`,
    'POST',
    { dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }
  );
  if (!invalidTimeRange.success && invalidTimeRange.status === 400) {
    console.log('   ✅ Correctly rejected startTime >= endTime');
    passedTests++;
  } else {
    console.log('   ❌ Should have rejected startTime >= endTime');
  }

  // Test invalid date format
  totalTests++;
  console.log('\n   Testing invalid date format...');
  const invalidDate = await apiRequest(
    `/businesses/${testData.businessId}/special-dates`,
    'POST',
    { date: '2025/12/25', isAvailable: false }
  );
  if (!invalidDate.success && invalidDate.status === 400) {
    console.log('   ✅ Correctly rejected invalid date format');
    passedTests++;
  } else {
    console.log('   ❌ Should have rejected invalid date format');
  }

  console.log(`\n   Validation tests passed: ${passedTests}/${totalTests}`);
  return passedTests === totalTests;
}

// ============================
// CLEANUP TEST
// ============================

async function testDeleteAvailability() {
  console.log('\n🗑️ Testing Delete Availability (Cleanup)...');

  if (testData.availabilityIds.length === 0) {
    console.log('❌ No availability IDs to delete');
    return false;
  }

  const result = await apiRequest(
    `/businesses/${testData.businessId}/availability/${testData.availabilityIds[0]}`,
    'DELETE'
  );

  if (result.success) {
    console.log('✅ Availability deleted successfully (breaks cascade deleted)');
  } else {
    console.log('❌ Delete availability failed:', result.data.message || result.data.error);
  }

  return result.success;
}

// ============================
// RUN ALL TESTS
// ============================

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 AVAILABILITY MANAGEMENT TESTS');
  console.log('═══════════════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  const tests = [
    // Setup
    { name: 'Register User', fn: testRegisterUser },
    { name: 'Create Business', fn: testCreateBusiness },

    // Availability tests
    { name: 'Create Availability', fn: testCreateAvailability },
    { name: 'Create Multiple Availabilities', fn: testCreateMultipleAvailabilities },
    { name: 'Get Availability', fn: testGetAvailability },
    { name: 'Update Availability', fn: testUpdateAvailability },

    // Break tests
    { name: 'Create Break', fn: testCreateBreak },
    { name: 'Get Breaks', fn: testGetBreaks },
    { name: 'Update Break', fn: testUpdateBreak },
    { name: 'Delete Break', fn: testDeleteBreak },

    // Special date tests
    { name: 'Create Special Date', fn: testCreateSpecialDate },
    { name: 'Create Special Date with Custom Hours', fn: testCreateSpecialDateWithCustomHours },
    { name: 'Get Special Dates', fn: testGetSpecialDates },
    { name: 'Get Special Dates with Date Range', fn: testGetSpecialDatesWithDateRange },
    { name: 'Update Special Date', fn: testUpdateSpecialDate },
    { name: 'Delete Special Date', fn: testDeleteSpecialDate },

    // Validation tests
    { name: 'Validation Errors', fn: testValidationErrors },

    // Cleanup
    { name: 'Delete Availability', fn: testDeleteAvailability },
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
