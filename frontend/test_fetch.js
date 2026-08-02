const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/admin/reports/revenue',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + '1|mock_token_just_in_case_we_dont_need_valid' // Actually, let's login to get token
  }
};

// Instead of hitting the API with a fake token, let's just write a route in api.php that bypasses auth, or I can use Tinker to print the JSON!
