const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const newUser = await User.create({ username, email, password, role });
    res.status(201).json({ success: true, user: newUser });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};