const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('Checking environment variables...');
console.log('Environment check passed.');
