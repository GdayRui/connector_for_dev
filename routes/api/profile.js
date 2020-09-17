const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route 	GET api/profile/me
// @desc 		Get current users profile
// @access 	Private
router.get(
	'/me',
	auth,
	async (req, res) => {
		try {
			const profile = await Profile.findOne({ user: req.user.id }).populate(
				'user',
				['name', 'avatar']
			);

			if (!profile) {
				return res.status(400).json({ msg: 'There is no profile for this user' });
			}
			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}
		// res.send('Profile route')
	});

// @route 	POST api/profile
// @desc 		Post a new profile
// @access 	Private
router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required')
				.not()
				.isEmpty(),
			check('skills', 'Skills is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		console.log(req.body);
		const {
			company,
			website,
			location,
			status,
			bio,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body;

		// Build profile obj
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (status) profileFields.status = status;
		if (bio) profileFields.bio = bio;
		if (githubusername) profileFields.githubusername = githubusername;
		if (skills) {
			profileFields.skills = skills.split(',').map(skill => skill.trim());
		};

		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (facebook) profileFields.social.facebook = facebook;
		if (twitter) profileFields.social.twitter = twitter;
		if (instagram) profileFields.social.instagram = instagram;
		if (linkedin) profileFields.social.linkedin = linkedin;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				// update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}

			// if not found then create new one
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}

		console.log(profileFields.social.youtube);
		res.send('Profile route');

	}
);

// @route 	GET api/profile
// @desc 		Get all profiles
// @access 	Public
router.get(
	'/',
	async (req, res) => {
		try {
			// 'populate()' join other doc's fields
			const allProfiles = await Profile.find().populate('user', ['name', 'avatar']);
			res.json(allProfiles);
		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route 	GET api/profile/user/:user_id
// @desc 		Get profile by user ID
// @access 	Public
router.get(
	'/user/:user_id',
	async (req, res) => {
		try {
			// 'populate()' join other doc's fields
			const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

			if (!profile) {
				return res.status(400).json({ msg: 'There is no profile for this user' });
			}
			res.json(profile);

		} catch (err) {
			console.log(err.message);
			// check if it is certain kind of err, valid or unvalid user_id all send back 400
			if (err.find == 'ObjectId') {
				return res.status(400).json({ msg: 'There is no profile for this user' });
			}
			res.status(500).send('Server Error');
		}
	}
);

// @route 	DELETE api/profile
// @desc 		Delete profile user posts
// @access 	Private
router.delete(
	'/',
	auth,
	async (req, res) => {
		try {
			// Remove users posts

			// Remove profile
			await Profile.findOneAndRemove({ user: req.user.id });

			// Remove user
			await User.findByIdAndRemove({ _id: req.user.id });

			res.json({ msg: 'User deleted' });

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route 	PUT api/profile/experience
// @desc 		Put profile experience
// @access 	Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required')
				.not()
				.isEmpty(),
			check('company', 'Company is required')
				.not()
				.isEmpty(),
			check('from', 'From date is required')
				.not()
				.isEmpty(),
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body;

		const newExperience = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		}

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExperience);
			await profile.save();

			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}

	});

// @route 	DELETE api/profile/experience/:exp_id
// @desc 		Delete experience from profile
// @access 	Private
router.delete(
	'/experience/:exp_id',
	auth,
	async (req, res) => {
		try {
			const profile = await Profile.findOne({ user: req.user.id });

			// Get remove idx
			const removeIndex = profile.experience
				.map(item => item.id)
				.indexOf(req.params.exp_id);

			profile.experience.splice(removeIndex, 1);

			await profile.save();
			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route 	PUT api/profile/education
// @desc 		Put profile education
// @access 	Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required')
				.not()
				.isEmpty(),
			check('degree', 'Degree is required')
				.not()
				.isEmpty(),
			check('majors', 'Majors is required')
				.not()
				.isEmpty(),
			check('from', 'From date is required')
				.not()
				.isEmpty(),
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			school,
			degree,
			majors,
			from,
			to,
			current,
			description
		} = req.body;

		const newEducation = {
			school,
			degree,
			majors,
			from,
			to,
			current,
			description
		}

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(newEducation);
			await profile.save();

			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}

	});

// @route 	DELETE api/profile/education/:exp_id
// @desc 		Delete education from profile
// @access 	Private
router.delete(
	'/education/:edu_id',
	auth,
	async (req, res) => {
		try {
			const profile = await Profile.findOne({ user: req.user.id });

			// Get remove idx
			const removeIndex = profile.education
				.map(item => item.id)
				.indexOf(req.params.exp_id);

			profile.education.splice(removeIndex, 1);

			await profile.save();
			res.json(profile);

		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server Error');
		}
	}
)

module.exports = router;
