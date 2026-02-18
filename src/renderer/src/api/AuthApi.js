import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const initiate_login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/customer-video-login`, {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const setup_mfa = async (session) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/setup-mfa`, {
      session,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** Request OTP for forgot password. Sends code to the given email. */
export const requestForgotPasswordOtp = async (username) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/customer-video-forgot-password`,
      {
        username,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** Confirm forgot password with OTP and new password. */
export const confirmForgotPassword = async (
  username,
  otp,
  newPassword,
  confirmPassword
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/customer-video-reset-password`,
      {
        username,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
