const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['candidate', 'employer']).withMessage('Role must be candidate or employer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, email, password, role, company } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const userCount = await User.countDocuments();
        const assignedRole = userCount === 0 ? 'admin' : (role || 'candidate');

        user = await User.create({
            name,
            email,
            password,
            role: assignedRole,
            company: assignedRole === 'employer' ? company : ''
        });

        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            message: assignedRole === 'admin' ? 'Admin account created' : 'Registration successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/me', protect, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('company').optional().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const { name, company, phone } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name;
        if (company !== undefined) updateFields.company = company;
        if (phone !== undefined) updateFields.phone = phone;

        const user = await User.findByIdAndUpdate(req.user.id, updateFields, { new: true });

        res.status(200).json({
            success: true,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, company: user.company }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
