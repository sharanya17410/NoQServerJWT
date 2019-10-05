var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
/* GET users listing. */
const User = require('../../models/User');
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

router.post('/', [
	check('name', 'Name is required').not().isEmpty(),
	check('email', 'Please include a valid email').isEmail(),
	check('password', 'Please enter a password with 7 or more characters').isLength({ min: 7 })
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	const { name, email, password } = req.body;
	try {
		//Check if user already exists
		let user = await User.findOne({ email });
		if (user) {
			return res.status(400).json({ errors: [{ msg: 'User already exists!!' }] });
		}
		// create a new user instance
		user = new User({
			name,
			email,
			password
		});

		//encrypt the password

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(password, salt);
		//save it to the database
		await user.save();
		const payload = {
			user: {
				id: user.id
			}
		}
		jwt.sign(
			payload,
			config.get('jwtSecret'),
			{ expiresIn: 360000 },
			(err, token) => {
				if (err) throw err;
				res.json({ token });
			});
		//res.send('User registered');
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}

});

module.exports = router;
