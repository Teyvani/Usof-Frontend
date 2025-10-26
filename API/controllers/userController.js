const userModel = require('../models/userModel.js');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const POST = 5173

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'diana.malashta17@gmail.com',
        pass: 'owma rjgp mjao rfeh'
    }
});

exports.register = async (req, res) => {
    const { login, full_name, password, email } = req.body;

    try {
        userModel.findByLogin(login, (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (user) return res.status(400).json({ error: 'Login already in use.' });

            userModel.findByEmail(email, async (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error.' });
                if (user) return res.status(400).json({ error: 'Email already in use.' });

                try {
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hash(password, salt);
                    const token = crypto.randomBytes(32).toString('hex');

                    userModel.createUser({ login, full_name, password: hash, email, email_confirmation_token: token }, (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to register user.' });

                        (async () => {
                            const info = await transporter.sendMail({
                                from: '"Usof" <diana.malashta17@gmail.com>',
                                to: email,
                                subject: 'Registration confirmation',
                                text: `To confirm your registration, follow the link: http://localhost:${POST}/confirm-email?token=` + token
                            });
                            console.log('Message sent: %s', info.messageId);
                        })();

                        return res.status(201).json({ message: 'User registered. Please confirm your email.' });
                    });
                } catch (error) {
                    console.error('Hashing error:', error);
                    return res.status(500).json({ error: 'Failed to register user.' });
                }
            });
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
};

exports.sendEmailTokenAgain = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    userModel.findByEmail(email, async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(400).json({ error: 'User not found.' });
        if (user.email_confirmed) return res.status(400).json({ error: 'Email already confirmed.' });

        const token = crypto.randomBytes(32).toString('hex');
        userModel.updateUser(user.id, { email_confirmation_token: token }, (err) => {
            if (err) return res.status(500).json({ error: 'Failed to set confirmation token.' });

            (async () => {
                const info = await transporter.sendMail({
                    from: '"Usof" <diana.malashta17@gmail.com>',
                    to: email,
                    subject: 'Registration confirmation message retry',
                    text: `To confirm your registration, follow the link: http://localhost:${POST}/confirm-email?token=` + token
                });
                console.log('Message sent: %s', info.messageId);
            })();
            return res.status(200).json({ message: 'Confirmation send again' });
        });
    });
};

exports.confirmEmail = async (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    try {
        userModel.findByEmailToken(token, (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (!user) return res.status(400).json({ error: 'Invalid token or email already confirmed.' });

            userModel.updateUser(user.id, { email_confirmed: true, email_confirmation_token: null }, (err) => {
                if (err) return res.status(500).json({ error: 'Failed to confirm email.' });
                return res.status(200).json({ message: 'Email confirmed successfully.' });
            });
        });
    } catch (error) {
        console.error('Confirm email error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
};

exports.login = (req, res) => {
    const { login, email, password } = req.body;
    const findUser = login ? userModel.findByLogin : userModel.findByEmail;
    const identifier = login || email;

    findUser(identifier, async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(400).json({ error: 'User not found.' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid password.' });
        if (!user.email_confirmed) return res.status(400).json({ error: 'Email not confirmed. Please confirm your email.' });

        req.session.user = {
            id: user.id,
            login: user.login,
            full_name: user.full_name,
            role: user.role
        };

        res.status(200).json({ message: 'Login successful', user: req.session.user });
    });
}

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Failed to logout.' });
        res.status(200).json({ message: 'Logout successful.' });
    });
}

exports.passwordResetRequest = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    userModel.findByEmail(email, async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (!user) return res.status(400).json({ error: 'User not found.' });
        const password_reset_token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 10); // 10 minutes
        const password_reset_token_expiration = expiration;
        userModel.updateUser(user.id, { password_reset_token, password_reset_token_expiration }, (err) => {
            if (err) return res.status(500).json({ error: 'Failed to set reset token.' });

                (async () => {
                    const info = await transporter.sendMail({
                        from: '"Usof" <diana.malashta17@gmail.com>',
                        to: email,
                        subject: 'Confirmation of password change',
                        text: `Attention! This link will be valid for 10 minutes. To confirm your password change, follow the link: http://localhost:${POST}/reset-password?token=` + password_reset_token
                    });
                    console.log('Message sent: %s', info.messageId);
                })();
            return res.status(200).json({ message: 'Password reset email sent.' });
        });
    });
}

exports.passwordTokenPage = async (req, res) => {
    const token = req.query.token;
    if(!token) return res.status(400).json({ error: 'Token required.' });
    return res.status(200).json({ message: "Put this request: /auth/reset-password and put this token in this request", token: token});
}

exports.passwordResetConfirm = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required.' });
    }
    
    try {
        userModel.findByResetToken(token, async (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (!user) return res.status(400).json({ error: 'Invalid token.' });

            if (new Date() > new Date(user.password_reset_token_expiration)) {
                userModel.updateUser(user.id, {
                    password_reset_token: null,
                    password_reset_token_expiration: null
                }, () => {});

                return res.status(400).json({ error: 'Token has expired. Please request a new password reset.' });
            }

            try {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(password, salt);

                userModel.updateUser(user.id, {
                    password: hash,
                    password_reset_token: null,
                    password_reset_token_expiration: null
                }, (err) => {
                    if (err) return res.status(500).json({ error: 'Failed to reset password.' });
                    return res.status(200).json({ message: 'Password has been reset successfully.' });
                });
            } catch (hashError) {
                console.error('Password hashing error:', hashError);
                return res.status(500).json({ error: 'Failed to process password.' });
            }
        });
    } catch (error) {
        console.error('Password reset confirm error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.user_id;
    try {
        userModel.findById(userId, (err, user) => {
            if(err) {
                console.error('Error finding user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if(!user) return res.status(404).json({ error: 'User not found' });

            userModel.deleteUser(userId, (err) =>{
                if (err) return res.status(500).json({ error: 'Failed to delete user.' });
                return res.status(200).json({ message: 'User deleted successfully.' });
            });
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
};

exports.updateUserRole = async (req, res) => {
    const userId = req.params.user_id;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    try {
        userModel.findById(userId, (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (!user) return res.status(404).json({ error: 'User not found.' });
            userModel.updateUser(userId, { role: role }, (err) => {
                if (err) return res.status(500).json({ error: 'Failed to update user role.' });
                return res.status(200).json({ message: 'User role updated successfully.' });
            });
        });
    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
}

exports.uploadAvatar = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    
    try {
        userModel.updateUser(req.session.user.id, { profile_picture: filePath }, (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            res.status(200).json({ message: 'Avatar updated successfully', path: filePath });
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
}

exports.getAvatar = async (req, res) => {
    const userId = req.params.id;

    try {
        userModel.findById(userId, (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error.' });
            if (!user) return res.status(404).json({ error: 'User not found.' });
            res.status(200).json({ imagePath: user.profile_picture });
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Server error.' });
    }
}

exports.getAllUsers = (req, res) => {
    try {
        userModel.getAllUsers((err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                return res.status(500).json({ error: 'Internal server error'});
            }

            const safeUsers = users.map(user => ({
                id: user.id,
                login: user.login,
                full_name: user.full_name,
                email: user.email,
                profile_picture: user.profile_picture,
                rating: user.rating,
                role: user.role,
                created_at: user.created_at
            }));

            res.json({ users: safeUsers });
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserById = (req, res) => {
    try {
        const userId = req.params.user_id;

        userModel.findById(userId, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!user) { return res.status(404).json({ error: 'User not found'});}

            const safeUser = {
                id: user.id,
                login: user.login,
                full_name: user.full_name,
                email: user.email,
                email_confirmed: user.email_confirmed,
                profile_picture: user.profile_picture,
                rating: user.rating,
                role: user.role,
                created_at: user.created_at
            };

            res.json({ user: safeUser });
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error'});
    }
};

exports.createUser = async (req, res) => {
    try {
        const { login, full_name, password, email, role } = req.body;
        if (!login || !full_name || !password || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        userModel.findByLogin(login, async (err, existingUser) => {
            if (err) {
                console.error('Error checking login:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (existingUser) {
                return res.status(400).json({ error: 'Login already in use' });
            }

            userModel.findByEmail(email, async (err, existingUser) => {
                if(err) {
                    console.error('Error checking email:', err);
                    return res.status(500).json({ error: 'Internal server error'});
                }
                if (existingUser) {
                    return res.status(400).json({ error: 'Email already in use' });
                }

                try{
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);

                    userModel.createUser({ login, full_name, password: hashedPassword, email, email_confirmation_token: null}, (err, results) => {
                        if (err) {
                            console.error('Error creating user:', err);
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        const userId = results.insertId;
                        userModel.updateUser(userId, { email_confirmed: true, role: role || 'user' }, (err) => {
                            if(err){
                                console.error('Error updating user:', err);
                                return res.status(500).json({ error: 'User created but failed to update role and confirm email'});
                            }

                            userModel.findById(userId, (err, newUser) => {
                                if(err) {
                                    console.error('Error fetching new user:', err);
                                    return res.status(500).json({ error: 'User created succesfully' });
                                }

                                res.status(201).json({
                                    message: 'User created successfully',
                                    user: {
                                        id: newUser.id,
                                        login: newUser.login,
                                        full_name: newUser.full_name,
                                        email: newUser.email,
                                        email_confirmed: newUser.email_confirmed,
                                        profile_picture: newUser.profile_picture,
                                        rating: newUser.rating,
                                        role: newUser.role,
                                        created_at: newUser.created_at
                                    }
                                });
                            });
                        });
                    });
                } catch (hashError) {
                    console.error('Password hashing error:', hashError);
                    return res.status(500).json({ error: 'Failed to create user due to password hashing error' });
                }
            });
        });
    } catch (error) {
        console.error('Unexpected error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateUser = (req, res) => {
    try {
        const userId = req.params.user_id;
        const currentUserId = req.session.user.id;
        const currentUserRole = req.session.user.role;
        const { full_name, email } = req.body;

        if (currentUserRole !== 'admin' && currentUserId != userId) {
            return res.status(403).json({ error: 'Your current role allows to update your own profile'});
        }
        if (!full_name && !email) {
            return res.status(400).json({ error: 'At least one field (full_name or email) must be provided' });
        }

        userModel.findById(userId, (err, user) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const updateFields = {};
            if (full_name) { updateFields.full_name = full_name; }
            if (email && email !== user.email) {
                updateFields.email = email;
                updateFields.email_confirmed = false;
                updateFields.email_confirmation_token = require('crypto').randomBytes(32).toString('hex');
            }
            if(Object.keys(updateFields).length === 0) {
                return res.status(400).json({ error: 'No changes detected' });
            }

            userModel.updateUser(userId, updateFields, (err) => {
                if(err) {
                    console.error('Error updating user:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if(updateFields.email_confirmation_token) {
                    transporter.sendMail({
                        from: '"Usof" <diana.malashta17@gmail.com>',
                        to: updateFields.email,
                        subject: 'Confirmation of new email address',
                        text: `To confirm your new email address, follow the link: http://localhost:${POST}/confirm-email?token=${updateFields.email_confirmation_token}`
                    }, (err, info) => {
                        if (err) console.error('Error sending email:', err);
                    });
                }

                userModel.findById(userId, (err, updatedUser) => {
                    if (err) {
                        console.error('Error fetching updated user:', err);
                        return res.status(500).json({ error: 'User updated succesfully but internal server error on fetching them' });
                    }

                    res.json({
                        message: 'User updated successfully. Please confirm your new email address if you changed it.',
                        user: {
                            id: updatedUser.id,
                            login: updatedUser.login,
                            full_name: updatedUser.full_name,
                            email: updatedUser.email,
                            email_confirmed: updatedUser.email_confirmed,
                            profile_picture: updatedUser.profile_picture,
                            rating: updatedUser.rating,
                            role: updatedUser.role,
                            created_at: updatedUser.created_at
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
