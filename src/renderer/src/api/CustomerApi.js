import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
// Get auth token from localStorage
const getAuthToken = () => {
  return sessionStorage.getItem("token") || "";
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** All languages (master list). */
export const listLanguages = async () => {
  try {
    const response = await apiClient.get("/list-all-video-languages");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch list of languages:", error);
    throw error;
  }
};

/** Available languages by video and audio. Response language names may include _Video or _Audio suffix; trim before use. */
export const getAvailableLanguages = async () => {
  try {
    const response = await apiClient.get("/get-availability-by-languages");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch available languages:", error);
    throw error;
  }
};

/** Top languages for the dashboard. For now returns mock data; replace with real endpoint when ready. */
export const getTopLanguages = async () => {
  // TODO: replace with real API call, e.g. apiClient.get("/top-languages")
  try {
    const response = await apiClient.get("/get-top-video-languages");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch top video languages:", error);
    throw error;
  }
};

export const getCallHistory = async () => {
  try {
    const response = await apiClient.get("/customer/call-history");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch call history:", error);
    throw error;
  }
};

export const listCallsHistoryVideo = async (params = {}) => {
  try {
    const { startDate, endDate, signal, ...rest } = params;
    const query = {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 10,
      ...rest,
    };
    if (startDate) query.start_date = startDate;
    if (endDate) query.end_date = endDate;
    const config = { params: query };
    if (signal) config.signal = signal;
    const response = await apiClient.get("/list-calls-history-video", config);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    console.error("Failed to fetch calls history:", error);
    throw error;
  }
};

export const downloadCallsHistoryVideoCsv = async (params = {}) => {
  try {
    const { startDate, endDate, signal, ...rest } = params;
    const query = {
      format: "csv",
      ...rest,
    };
    if (startDate) query.start_date = startDate;
    if (endDate) query.end_date = endDate;
    const config = {
      params: query,
      responseType: "blob",
    };
    if (signal) config.signal = signal;
    return await apiClient.get("/get-video-calls-to-download-chunked", config);
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    console.error("Failed to download calls history CSV:", error);
    throw error;
  }
};

export const getCallsSummary = async (params = {}) => {
  try {
    const { startDate, endDate, signal, ...rest } = params;
    const query = { ...rest };
    if (startDate) query.start_date = startDate;
    if (endDate) query.end_date = endDate;
    const config = { params: query };
    if (signal) config.signal = signal;
    const response = await apiClient.get("/get-calls-summary", config);
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    console.error("Failed to fetch calls summary:", error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await apiClient.get("/customer/profile");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put("/customer/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
};

export const getCustomerVideoAccountById = async () => {
  try {
    const response = await apiClient.get("/get-customer-video-account-by-id", {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch customer video account:", error);
    throw error;
  }
};

export const userUpdateCustomerVideoAccount = async (data) => {
  try {
    const response = await apiClient.post(
      "/user-update-customer-video-account",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Failed to update customer video account:", error);
    throw error;
  }
};

export const changeProfilePictureVideo = async (file) => {
  try {
    const formData = new FormData();
    formData.append("profile_picture", file);
    const response = await apiClient.post(
      "/change-profile-picture-video",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to change profile picture:", error);
    throw error;
  }
};

export const deleteProfilePictureVideo = async () => {
  try {
    const response = await apiClient.post("/delete-profile-picture-video");
    return response.data;
  } catch (error) {
    console.error("Failed to delete profile picture:", error);
    throw error;
  }
};

export const storeVideoFlowData = async (data) => {
  try {
    const response = await apiClient.post("/store-video-flow-data", data);
    return response.data;
  } catch (error) {
    console.error("Failed to store video flow data:", error);
    throw error;
  }
};

export const getUsageByVideoCustomer = async () => {
  try {
    const response = await apiClient.get("/get-usage-by-video-customer");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch usage by video customer:", error);
    throw error;
  }
};

export const listLanguagesUsageByCustomer = async (params = {}) => {
  try {
    const response = await apiClient.get("/list-languages-usage-by-customer", {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 10,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch languages usage by customer:", error);
    throw error;
  }
};

/** Change password. Expects { old_password, new_password }. Returns new access token to store. */
export const changePassword = async (
  oldPassword,
  newPassword,
  confirmPassword
) => {
  try {
    const response = await apiClient.post("/user-video-change-password", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to change password:", error);
    throw error;
  }
};
