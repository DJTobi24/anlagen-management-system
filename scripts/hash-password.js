const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`\nSQL Update:`);
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@swm.de';`);
});