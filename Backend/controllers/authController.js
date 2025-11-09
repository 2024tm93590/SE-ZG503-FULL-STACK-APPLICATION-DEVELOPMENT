const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { Email: email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ Name: name, Email: email, Password: password, Role: role });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.Id, name: user.Name, email: user.Email, role: user.Role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { Email: email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log('DB password:', user.Password);
    console.log('Input password:', password);

    const isMatch = await bcrypt.compare(password, user.Password);
    console.log('Password match result:', isMatch);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.Id, role: user.Role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: { id: user.Id, name: user.Name, email: user.Email, role: user.Role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
