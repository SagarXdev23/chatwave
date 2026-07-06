const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');

dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB.");
    const users = await User.find({});
    console.log("USERS IN DB:");
    console.log(users.map(u => ({ id: u._id, username: u.username, phone: u.phone })));
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
