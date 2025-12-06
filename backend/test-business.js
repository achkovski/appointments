/**
 * Business & Service Endpoints Test Script
 * Run with: node test-business.js
 */

const API_BASE = 'http://localhost:5000/api';

// Store test data
const testData = {
  user: {
    email: 'businessowner@example.com',
    password: 'Test@1234',
    firstName: 'Business',
    lastName: 'Owner',
  },
  token: null,
  businessId: null,
  serviceIds: [],
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

// Test functions
async function testRegisterUser() {
  console.log('\n📝 Testing User Registration...');
  const result = await apiRequest('/auth/register', 'POST', testData.user, false);

  if (result.success) {
    console.log('✅ User registered successfully');
    testData.token = result.data.token;
  } else {
    console.log('❌ Registration failed:', result.data.error);
  }

  return result.success;
}

async function testCreateBusiness() {
  console.log('\n🏢 Testing Create Business...');
  const businessData = {
    businessName: 'Test Dental Clinic',
    description: 'A modern dental clinic offering comprehensive dental care',
    address: '123 Main Street, New York, NY 10001',
    phone: '+1234567890',
    email: 'contact@testdentalclinic.com',
    website: 'https://testdentalclinic.com',
    businessType: 'Healthcare',
    capacityMode: 'SINGLE',
    defaultSlotInterval: 30,
    autoConfirm: true,
    requireEmailConfirmation: false,
  };

  const result = await apiRequest('/businesses', 'POST', businessData);

  if (result.success) {
    console.log('✅ Business created successfully');
    console.log('   Business ID:', result.data.business.id);
    console.log('   Slug:', result.data.business.slug);
    console.log('   Booking URL:', result.data.bookingUrl);
    console.log('   QR Code:', result.data.business.qrCodeUrl ? 'Generated' : 'Not generated');
    testData.businessId = result.data.business.id;
  } else {
    console.log('❌ Create business failed:', result.data.error);
  }

  return result.success;
}

async function testGetBusinesses() {
  console.log('\n📋 Testing Get All Businesses...');
  const result = await apiRequest('/businesses', 'GET');

  if (result.success) {
    console.log('✅ Get businesses successful');
    console.log('   Count:', result.data.count);
  } else {
    console.log('❌ Get businesses failed:', result.data.error);
  }

  return result.success;
}

async function testGetBusinessById() {
  console.log('\n🔍 Testing Get Business By ID...');
  const result = await apiRequest(`/businesses/${testData.businessId}`, 'GET');

  if (result.success) {
    console.log('✅ Get business successful');
    console.log('   Name:', result.data.business.businessName);
    console.log('   Slug:', result.data.business.slug);
  } else {
    console.log('❌ Get business failed:', result.data.error);
  }

  return result.success;
}

async function testCreateServices() {
  console.log('\n💼 Testing Create Services...');

  const services = [
    {
      businessId: testData.businessId,
      name: 'General Checkup',
      description: 'Comprehensive dental examination and cleaning',
      duration: 30,
      price: '100.00',
      displayOrder: 0,
    },
    {
      businessId: testData.businessId,
      name: 'Teeth Whitening',
      description: 'Professional teeth whitening treatment',
      duration: 60,
      price: '250.00',
      displayOrder: 1,
    },
    {
      businessId: testData.businessId,
      name: 'Root Canal',
      description: 'Root canal treatment for infected teeth',
      duration: 90,
      price: '500.00',
      displayOrder: 2,
    },
  ];

  let allSuccess = true;

  for (const service of services) {
    const result = await apiRequest('/services', 'POST', service);

    if (result.success) {
      console.log(`✅ Service "${service.name}" created successfully`);
      testData.serviceIds.push(result.data.service.id);
    } else {
      console.log(`❌ Create service "${service.name}" failed:`, result.data.error);
      allSuccess = false;
    }
  }

  return allSuccess;
}

async function testGetServicesByBusiness() {
  console.log('\n📋 Testing Get Services By Business...');
  const result = await apiRequest(`/services/business/${testData.businessId}`, 'GET');

  if (result.success) {
    console.log('✅ Get services successful');
    console.log('   Count:', result.data.count);
    result.data.services.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.duration} min, $${service.price})`);
    });
  } else {
    console.log('❌ Get services failed:', result.data.error);
  }

  return result.success;
}

async function testUpdateService() {
  console.log('\n✏️  Testing Update Service...');

  if (testData.serviceIds.length === 0) {
    console.log('⚠️  No services to update');
    return false;
  }

  const updateData = {
    name: 'General Checkup & Cleaning',
    price: '120.00',
  };

  const result = await apiRequest(`/services/${testData.serviceIds[0]}`, 'PUT', updateData);

  if (result.success) {
    console.log('✅ Service updated successfully');
    console.log('   Updated name:', result.data.service.name);
    console.log('   Updated price:', result.data.service.price);
  } else {
    console.log('❌ Update service failed:', result.data.error);
  }

  return result.success;
}

async function testUpdateBusiness() {
  console.log('\n✏️  Testing Update Business...');

  const updateData = {
    description: 'A premium dental clinic with state-of-the-art equipment',
    phone: '+1987654321',
  };

  const result = await apiRequest(`/businesses/${testData.businessId}`, 'PUT', updateData);

  if (result.success) {
    console.log('✅ Business updated successfully');
    console.log('   Updated description:', result.data.business.description);
    console.log('   Updated phone:', result.data.business.phone);
  } else {
    console.log('❌ Update business failed:', result.data.error);
  }

  return result.success;
}

async function testGetBusinessBySlug() {
  console.log('\n🔗 Testing Get Business By Slug (Public)...');

  // First get the business to get its slug
  const businessResult = await apiRequest(`/businesses/${testData.businessId}`, 'GET');

  if (!businessResult.success) {
    console.log('❌ Could not get business slug');
    return false;
  }

  const slug = businessResult.data.business.slug;

  // Now test public access
  const result = await apiRequest(`/businesses/slug/${slug}`, 'GET', null, false);

  if (result.success) {
    console.log('✅ Get business by slug successful');
    console.log('   Business:', result.data.business.businessName);
    console.log('   Services count:', result.data.services.length);
  } else {
    console.log('❌ Get business by slug failed:', result.data.error);
  }

  return result.success;
}

async function testRegenerateQRCode() {
  console.log('\n🔄 Testing Regenerate QR Code...');

  const result = await apiRequest(`/businesses/${testData.businessId}/regenerate-qr`, 'POST');

  if (result.success) {
    console.log('✅ QR code regenerated successfully');
    console.log('   QR Code:', result.data.qrCodeUrl ? 'Generated' : 'Not generated');
  } else {
    console.log('❌ Regenerate QR code failed:', result.data.error);
  }

  return result.success;
}

async function testDeleteService() {
  console.log('\n🗑️  Testing Delete Service...');

  if (testData.serviceIds.length === 0) {
    console.log('⚠️  No services to delete');
    return false;
  }

  // Delete the last service
  const serviceIdToDelete = testData.serviceIds[testData.serviceIds.length - 1];

  const result = await apiRequest(`/services/${serviceIdToDelete}`, 'DELETE');

  if (result.success) {
    console.log('✅ Service deleted successfully');
    testData.serviceIds.pop();
  } else {
    console.log('❌ Delete service failed:', result.data.error);
  }

  return result.success;
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 BUSINESS & SERVICE ENDPOINTS TEST SUITE');
  console.log('='.repeat(60));
  console.log('📍 API Base URL:', API_BASE);
  console.log('⏰ Started at:', new Date().toLocaleString());

  const results = {
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: 'User Registration', fn: testRegisterUser },
    { name: 'Create Business', fn: testCreateBusiness },
    { name: 'Get All Businesses', fn: testGetBusinesses },
    { name: 'Get Business By ID', fn: testGetBusinessById },
    { name: 'Create Services', fn: testCreateServices },
    { name: 'Get Services By Business', fn: testGetServicesByBusiness },
    { name: 'Update Service', fn: testUpdateService },
    { name: 'Update Business', fn: testUpdateBusiness },
    { name: 'Get Business By Slug (Public)', fn: testGetBusinessBySlug },
    { name: 'Regenerate QR Code', fn: testRegenerateQRCode },
    { name: 'Delete Service', fn: testDeleteService },
  ];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.failed++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
  }
}

// Run the tests
runTests().catch(console.error);
