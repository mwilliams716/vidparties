const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../config/auth');

// Load Models 
const User = require('../models/User');

// Log In Function
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/',
        failureFlash: true
    })(req, res, next);
});

// Sign Up Function
router.post('/signup', (req, res) => {
    const { firstname, lastname, username, reg_email, pass, pass2, gender, country, birthday } = req.body;
    let errors = [];

    if(!firstname || !lastname || !username || !reg_email || !pass || !pass2 || !gender || !country || !birthday) {
        errors.push({ msg: 'All Fields Required' });
    }
    if(pass != pass2) {
        errors.push({ msg: 'Your Password Fields Do Not Match' });
    }
    if(pass.length < 7) {
        errors.push({ msg: 'Passwords Should Be At Lease 7 Characters' });
    }
    if(username.length < 3 || username.length > 32) {
        errors.push({ msg: 'Usernames Should Be 3-32 Characters' });
    }
    if(errors.length > 0) {
        res.render('index', {
            title: 'VidPartieds',
            errors: errors
        });
    } else {
        User.findOne({ email: reg_email }).then(user => {
            if(user) {
                errors.push({ msg: 'Email Already Exists' });
                res.render('index', {
                    title: 'VidPartieds',
                    errors: errors
                });
            } else {
                User.findOne({ username: username }).then(user => {
                    if(user) {
                        errors.push({ msg: 'Username Already Exists' });
                        res.render('index', {
                            title: 'VidPartieds',
                            errors: errors
                        });
                    } else {
                        let newUser = new User({
                            firstname: firstname, 
                            lastname: lastname,
                            username: username,
                            email: reg_email,
                            password: pass,
                            gender: gender,
                            country: country,
                            birthday: birthday
                        });

                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if (err) throw err;
                                newUser.password = hash;
                                newUser
                                    .save()
                                    .then(user => {
                                        req.flash(
                                            'success_msg',
                                            'You are now registered and can log in'
                                        );
                                        res.redirect('/');
                                    })
                                    .catch(err => console.log(err));
                            });
                        });
                    }
                });
            }
        });
    }
});

// Dashboard Page
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', {
        title: 'VidParties',
        logUser: req.user
    });
});

// Profile Page
router.get('/:id', ensureAuthenticated, (req, res) => {
    User.findOne({ username: req.params.id }, (err, user) => {
        if(err) {
            console.log(err);
        } else {
            res.render('profile', {
                title: user.firstname + ' ' + user.lastname,
                logUser: req.user,
                user: user
            });
        }
    });
});

// Log Out Function
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
});

module.exports = router;