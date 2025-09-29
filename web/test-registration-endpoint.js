#!/usr/bin/env node

// Test the registration endpoint directly
const fetch = require('node-fetch');

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint\n');
  
  const testData = {
    email: 'hiukiny@gmail.com',
    password: 'testpassword123'
  };
  
  console.log('Sending registration request...');
  console.log('Email:', testData.email);
  console.log('Password length:', testData.password.length);
  console.log('');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Registration successful!');
      console.log('Check SendGrid dashboard for email activity');
    } else {
      console.log('\n❌ Registration failed');
    }
    
  } catch (error) {
    console.log('\n❌ Network error:', error.message);
    console.log('Make sure your Next.js server is running on localhost:3000');
  }
}

testRegistration();
