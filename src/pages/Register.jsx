import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  // Use env variables here
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleResponse = async (response) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/google/`, {
        token: response.credential,
      });
      setPendingEmail(res.data.email);
      setShowOtp(true);
      setSuccess('OTP sent to your email from Google sign-in.');
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed.');
    }
  };

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv'),
        { theme: 'outline', size: 'large' }
      );
    }
  }, [GOOGLE_CLIENT_ID]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { username, email, password } = formData;
      await axios.post(`${BACKEND_URL}/api/auth/register/`, {
        username,
        email,
        password,
      });
      setPendingEmail(email);
      setShowOtp(true);
      setSuccess('OTP sent to your email. Please verify.');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          'Registration failed.'
      );
    }
  };

  const handleOtpSubmit = async () => {
    setError('');
    try {
      await axios.post(`${BACKEND_URL}/api/auth/verify-otp/`, {
        email: pendingEmail,
        otp: otp,
      });
      setSuccess('OTP verified. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          'OTP verification failed.'
      );
    }
  };

  return (
    <div>
      <h2>Register</h2>

      {!showOtp && (
        <form onSubmit={handleRegister}>
          <div>
            <label>Username:</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Email:</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Password:</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Confirm Password:</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Register</button>
        </form>
      )}

      {showOtp && (
        <div>
          <p>
            Enter OTP sent to: <strong>{pendingEmail}</strong>
          </p>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={handleOtpSubmit}>Verify OTP</button>
        </div>
      )}

      <hr />

      <div>
        <h4>Or register with Google:</h4>
        <div id="googleSignInDiv"></div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default Register;
