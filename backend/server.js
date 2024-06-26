import cors from "cors"; // Approves requests from other domains
import express from "express"; // Framework to create a server
import mongoose from "mongoose"; // To access MongoDB
import bcrypt from "bcrypt"; // Library to hash passwords safely
import jwt from "jsonwebtoken"; // Library to create a token for authenticating users - usually put in cookie
import expressListEndpoints from "express-list-endpoints";

// Set the URL to connect MongoDB. If the environment variable is not set, connect to the local MongoDB instance.
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise; // With this, we can use async/await

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Define the user schema / how the data is structured for mongo
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 8 },
  email: { type: String, required: true, unique: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
  password: { type: String, required: true },
  token: { type: String },
});

// Hashing the password before the user is saved (mongo thing)
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Create the User model
const User = mongoose.model("User", userSchema);

// Endpoint - registration
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body; // Getting username and password info from req.body

    /* if (password.length < 8) {
      res.status(400).send("Passwords need to be at least 8 characters long");
    } */

    // Check that user is new or has an account already
    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({field: "username", message: "This username is already taken."})
      }
      if (exisitngUser.email === email) {
        return res.status(400).json({ field: "email", message: "This email is already registered."})
      }
    }

    const user = new User({ username, password }); // Create new user
    await user.save(); // Here, finally save user info in the database 
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(400).send("Error registering user");
  }
});

// Endpoint - login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body; // body contains post request data (user's input)
    const user = await User.findOne({ username }); // search user by username
    if (!user || !(await bcrypt.compare(password, user.password))) {
      //(right one, user's input)
      return res.status(401).send("Invalid username or password.");
    }
    const token = jwt.sign({ userId: user._id }, process.env.SECRET, {
      //create JWT token
      expiresIn: "1h",
    });
    user.token = token; // save token in user's token field
    await user.save(); // update the user data
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send("Error logging in user");
  }
});

// re-useable token checker - Authentication middleware - express thing
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]; // Get token from request headers
  if (!token) return res.status(401).send("Access denied"); // If no token, deny access

  jwt.verify(token, process.env.SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid token"); // If token is invalid, deny access
    req.user = user; // Add user info to request
    next(); // Proceed to the next middleware
    console.log(process.env.SECRET)
  });
};

// Endpoint accessible only to authenticated users - with using above middleware (in this case, token checker)
app.get("/protected", authenticateToken, (req, res) => {
  res.status(200).send("This is protected content"); // Return protected content
});

// API documentation endpoint
app.get("/", (req, res) => {
  res.json(
    expressListEndpoints(app).map((endpoint) => ({
      method: endpoint.methods.join(", "),
      path: endpoint.path,
      middlewares: endpoint.middlewares,
    }))
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`); // Log the server start message
});
