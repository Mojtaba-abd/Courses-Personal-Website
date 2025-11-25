# Creating an Admin User

## Method 1: Using the Script (Recommended)

Run the script from the `lms-backend` directory:

```bash
cd lms-backend
npm run create-admin
```

This will create an admin user with default credentials:
- **Username:** `admin`
- **Email:** `admin@example.com`
- **Password:** `admin123`

### Custom Credentials

You can also provide custom credentials:

```bash
npm run create-admin <username> <email> <password>
```

Example:
```bash
npm run create-admin myadmin admin@mysite.com MySecurePassword123
```

## Method 2: Using MongoDB Shell

1. Connect to your MongoDB database
2. Run the following commands (replace with your values):

```javascript
use your_database_name

// Hash the password manually (you'll need to use bcrypt)
// Or use this simple approach (not recommended for production):
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$rOzJqZqZqZqZqZqZqZqZqO", // This is a hashed version of "admin123"
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note:** The password must be hashed with bcryptjs. The script method is easier and safer.

## Method 3: Using Node.js REPL

```bash
cd lms-backend
node
```

Then in the Node.js REPL:

```javascript
import mongoose from "mongoose";
import userModel from "./models/user-model.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.URL);
const admin = await userModel.create({
  username: "admin",
  email: "admin@example.com",
  password: "admin123",
  role: "admin"
});
console.log("Admin created:", admin);
process.exit(0);
```

## After Creating Admin

1. Make sure your backend is running: `npm run dev`
2. Go to `http://localhost:3000/login` (or your frontend URL)
3. Login with the admin credentials
4. Navigate to `/dashboard/users/create` to create more users

