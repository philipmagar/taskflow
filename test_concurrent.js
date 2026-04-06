const axios = require('axios');
const http = require('http');

// Use a shared http agent to manage concurrent connections better if needed
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });

async function testConcurrency() {
  const PORT = 3000;
  const API_URL = `http://localhost:${PORT}/api/v1`;
  const NUM_REQUESTS = 50;
  
  // 1. First, we need to log in or create a dummy user
  // Let's create a user
  const email = `testuser_${Date.now()}@test.com`;
  const password = 'password123';
  
  let token;
  let userId;
  
  try {
    const registerRes = await axios.post(`${API_URL}/users/register`, {
      name: 'Concurrent Tester',
      email,
      password,
      passwordConfirm: password
    }, { httpAgent });
    
    token = registerRes.data.token;
    userId = registerRes.data.data.user.id;
    console.log(`User created. Email: ${email}, ID: ${userId}`);
    
    // Check initial user stats if available
  } catch (error) {
    console.error('Failed to create user:', error.message);
    if (error.response) console.error(error.response.data);
    return;
  }

  // 2. Fire 50 concurrent task creation requests
  console.log(`Firing ${NUM_REQUESTS} concurrent requests to create tasks...`);
  
  const startTime = Date.now();
  const requests = [];
  
  for (let i = 0; i < NUM_REQUESTS; i++) {
    requests.push(
      axios.post(`${API_URL}/tasks`, {
        title: `Task ${i}`,
        description: `Description for task ${i}`
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        httpAgent
      }).catch(err => {
        return { error: true, message: err.message, res: err.response?.data };
      })
    );
  }
  
  const results = await Promise.all(requests);
  const endTime = Date.now();
  
  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.filter(r => r.error).length;
  
  console.log(`Requesters finished in ${endTime - startTime}ms`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log("Sample error:", results.find(r => r.error));
  }

  // 3. Verify final state
  try {
    // We can fetch tasks to see how many were actually created
    const tasksRes = await axios.get(`${API_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      httpAgent
    });
    
    const tasksCount = tasksRes.data.results;
    console.log(`Total tasks retrieved from DB: ${tasksCount}`);
    
    // It would be great to check the user.task_count directly if there's an endpoint for it
    // e.g. /users/me
    const meRes = await axios.get(`${API_URL}/users/me`, {
      headers: {
         Authorization: `Bearer ${token}`
      },
      httpAgent
    });
    
    const userTaskCount = meRes.data.data.user.task_count;
    console.log(`User's internal task_count: ${userTaskCount}`);
    
    if (tasksCount === NUM_REQUESTS && userTaskCount === NUM_REQUESTS) {
      console.log('✅ TEST PASSED: No race conditions detected. Counts match exactly.');
    } else {
      console.log('❌ TEST FAILED: Race condition or failures detected.');
    }
  } catch (err) {
    console.error('Failed to verify final state:', err.message);
  }
}

testConcurrency();
