const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs'); // for password hashing
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

// @route 	POST api/users
// @desc 		Test route
// @access 	Public
router.post(
	'/',
	[
		check('name', 'Name is required')
			.not().isEmpty(),
		check('email', 'Please enter a valid email')
			.isEmail(),
		check('password', 'Please enter a password with minimum 6 characters ')
			.isLength({ min: 6 })
	],
	async (req, res) => {
		console.log(req.body);
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;

		try {

			// Check if user exists
			let user = await User.findOne({ email });

			if (user) {
				res.status(400).json({ errors: [{ msg: 'User already exists' }] });
			}

			// Get users gravatar
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			})

			user = new User({
				name,
				email,
				avatar,
				password
			})

			// Encrypt password and save the new user
			const salt = await bcrypt.genSalt(10); // length

			user.password = await bcrypt.hash(password, salt); // hide password

			await user.save();

			// Return JWT
			const payload = {
				user: {
					id: user.id
				}
			}

			jwt.sign(
				payload,
				config.get('jwtSecret'),
				{ expiresIn: 360000 }, // production set to 3600
				(err, token) => {
					if (err) throw err;
					res.json({ token }); // respons data is token
				}
			);

			res.send('User registered');

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server error');
		}
	});

module.exports = router;