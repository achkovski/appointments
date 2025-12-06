/**
 * Authentication Endpoints Test Script
 * Run with: node test-auth.js
 */

const API_BASE = 'http://localhost:5000/api/auth';

// Store test data
const testData = {
  user: {
    email: 'testuser@example.com',
    password: 'Test@1234',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
  },
  token: null,
  verificationToken: null,
  resetToken: null,
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  if (testData.token && endpoint !== '/register' && endpoint !== '/login') {
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
async function testRegister() {
  console.log('\n📝 Testing User Registration...');
  const result = await apiRequest('/register', 'POST', testData.user);

  if (result.success) {
    console.log('✅ Registration successful');
    console.log('   User ID:', result.data.user.id);
    console.log('   Email:', result.data.user.email);
    testData.token = result.data.token;
    testData.verificationToken = result.data.verificationToken;
    console.log('   Token:', testData.token ? 'Generated' : 'Missing');
    console.log('   Verification Token:', testData.verificationToken || 'Not provided (production mode)');
  } else {
    console.log('❌ Registration failed:', result.data.error || result.data.message);
  }

  return result.success;
}

async function testLogin() {
  console.log('\n🔐 Testing User Login...');
  const result = await apiRequest('/login', 'POST', {
    email: testData.user.email,
    password: testData.user.password,
  });

  if (result.success) {
    console.log('✅ Login successful');
    console.log('   User:', result.data.user.firstName, result.data.user.lastName);
    console.log('   Email Verified:', result.data.user.emailVerified);
    testData.token = result.data.token;
  } else {
    console.log('❌ Login failed:', result.data.error);
  }

  return result.success;
}

async function testGetMe() {
  console.log('\n👤 Testing Get Current User...');
  const result = await apiRequest('/me', 'GET');

  if (result.success) {
    console.log('✅ Get user successful');
    console.log('   User:', result.data.user.firstName, result.data.user.lastName);
    console.log('   Email:', result.data.user.email);
    console.log('   Role:', result.data.user.role);
  } else {
    console.log('❌ Get user failed:', result.data.error);
  }

  return result.success;
}

async function testVerifyEmail() {
  console.log('\n✉️  Testing Email Verification...');

  if (!testData.verificationToken) {
    console.log('⚠️  Skipping: No verification token available (production mode)');
    return true; // Skip in production mode
  }

  const result = await apiRequest('/verify-email', 'POST', {
    token: testData.verificationToken,
  });

  if (result.success) {
    console.log('✅ Email verification successful');
  } else {
    console.log('❌ Email verification failed:', result.data.error);
  }

  return result.success;
}

async function testForgotPassword() {
  console.log('\n🔑 Testing Forgot Password...');
  const result = await apiRequest('/forgot-password', 'POST', {
    email: testData.user.email,
  });

  if (result.success) {
    console.log('✅ Forgot password request successful');
    testData.resetToken = result.data.resetToken;
    console.log('   Reset Token:', testData.resetToken || 'Not provided (production mode)');
  } else {
    console.log('❌ Forgot password failed:', result.data.error);
  }

  return result.success;
}

async function testResetPassword() {
  console.log('\n🔒 Testing Reset Password...');

  if (!testData.resetToken) {
    console.log('⚠️  Skipping: No reset token available (production mode)');
    return true; // Skip in production mode
  }

  const newPassword = 'NewTest@1234';

  const result = await apiRequest('/reset-password', 'POST', {
    token: testData.resetToken,
    newPassword,
  });

  if (result.success) {
    console.log('✅ Password reset successful');
    // Update password for future tests
    testData.user.password = newPassword;
  } else {
    console.log('❌ Password reset failed:', result.data.error);
  }

  return result.success;
}

async function testLoginAfterReset() {
  console.log('\n🔐 Testing Login After Password Reset...');
  const result = await apiRequest('/login', 'POST', {
    email: testData.user.email,
    password: testData.user.password,
  });

  if (result.success) {
    console.log('✅ Login with new password successful');
    testData.token = result.data.token;
  } else {
    console.log('❌ Login failed:', result.data.error);
  }

  return result.success;
}

async function testLogout() {
  console.log('\n👋 Testing Logout...');
  const result = await apiRequest('/logout', 'POST');

  if (result.success) {
    console.log('✅ Logout successful');
  } else {
    console.log('❌ Logout failed:', result.data.error);
  }

  return result.success;
}

async function testInvalidEmail() {
  console.log('\n🚫 Testing Invalid Email Validation...');
  const result = await apiRequest('/register', 'POST', {
    ...testData.user,
    email: 'invalid-email',
  });

  if (!result.success && result.data.error.includes('valid email')) {
    console.log('✅ Email validation working correctly');
    return true;
  } else {
    console.log('❌ Email validation failed');
    return false;
  }
}

async function testWeakPassword() {
  console.log('\n🚫 Testing Weak Password Validation...');
  const result = await apiRequest('/register', 'POST', {
    ...testData.user,
    email: 'test2@example.com',
    password: 'weak',
  });

  if (!result.success && result.data.error.includes('Password must')) {
    console.log('✅ Password validation working correctly');
    console.log('   Error:', result.data.error);
    return true;
  } else {
    console.log('❌ Password validation failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 AUTHENTICATION ENDPOINTS TEST SUITE');
  console.log('='.repeat(60));
  console.log('📍 API Base URL:', API_BASE);
  console.log('⏰ Started at:', new Date().toLocaleString());

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Run tests sequentially
  const tests = [
    { name: 'Invalid Email Validation', fn: testInvalidEmail },
    { name: 'Weak Password Validation', fn: testWeakPassword },
    { name: 'User Registration', fn: testRegister },
    { name: 'User Login', fn: testLogin },
    { name: 'Get Current User', fn: testGetMe },
    { name: 'Email Verification', fn: testVerifyEmail },
    { name: 'Forgot Password', fn: testForgotPassword },
    { name: 'Reset Password', fn: testResetPassword },
    { name: 'Login After Reset', fn: testLoginAfterReset },
    { name: 'Logout', fn: testLogout },
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
