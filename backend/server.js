// Import dependencies
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');  // Added path module

const app = express();
const port = process.env.PORT || 3000;  // Use environment port if available

// Connect to MongoDB (use env variable or fallback to local)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarttaskdb')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose schemas & models
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const taskSchema = new mongoose.Schema({
  email: String,
  task: String,
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);

// Middleware
app.use(cors());
app.use(express.json());

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err)
      return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// API routes
//app.get('/', (req, res) => {
  //res.send('SmartTask Manager backend server is running!');
//});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const userTasks = await Task.find({ email: req.user.email });
    res.json(userTasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { task } = req.body;
    if (!task)
      return res.status(400).json({ message: 'Task content required' });

    const newTask = new Task({ email: req.user.email, task });
    await newTask.save();
    res.json({ message: 'Task added', task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { task } = req.body;
    if (!task)
      return res.status(400).json({ message: 'Task content required' });

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, email: req.user.email },
      { task },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, email: req.user.email });
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// Serve static frontend files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch all other routes and return the frontend's main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dashboard.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Serve static frontend files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch all other routes and return the frontend's main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend/dashboard.html')); // Or your preferred start page
});
