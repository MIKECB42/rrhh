const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('mihai', 10);
console.log(hash);