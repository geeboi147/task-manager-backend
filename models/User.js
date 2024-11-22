const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [50, 'Username must not exceed 50 characters'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    profilePicture: {
      data: {
        type: Buffer,
        required: false, // Make the profile picture optional
      },
      contentType: {
        type: String,
        required: false, // Make the content type optional
      },
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash the password before saving the user
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hashing.');
    return next();
  }

  try {
    console.log('Password before hashing:', this.password);
    const salt = await bcrypt.genSalt(12); // Strong salt rounds
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Hashed Password (During Registration):', this.password);
    next();
  } catch (error) {
    console.error('Error during hashing:', error);
    next(error);
  }
});

// Method to compare a candidate password with the hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  console.log('Comparing passwords...');
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('Password comparison failed');
  }
};

module.exports = mongoose.model('User', UserSchema);
