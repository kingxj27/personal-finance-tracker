const Database = require('better-sqlite3');
const db = new Database('dev.db');
console.log(db.prepare('select count(*) as c from "User"').get());
