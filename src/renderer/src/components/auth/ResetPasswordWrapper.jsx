import React, { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Field, Label, ErrorMessage } from "../../components/ui/fieldset";
import { Heading } from "../../components/ui/heading";
import { Input } from "../../components/ui/input";
import { Text, TextLink } from "../../components/ui/text";
import { AuthLayout } from "../../components/ui/auth-layout";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import { confirmForgotPassword } from "../../api/AuthApi";

// Custom form field component
const FormField = ({ label, ...props }) => {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error;

  return (
    <Field>
      <Label>{label}</Label>
      <Input
        {...field}
        {...props}
        className={hasError ? "border-red-500" : ""}
      />
      {hasError && <ErrorMessage>{meta.error}</ErrorMessage>}
    </Field>
  );
};

const ResetPasswordWrapper = () => {
  const [searchParams] = useSearchParams();
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const username = searchParams.get("username") || "";

  useEffect(() => {
    if (!username) {
      navigate("/forgot-password", { replace: true });
    }
  }, [username, navigate]);

  if (!username) {
    return null;
  }

  // Validation schema
  const validationSchema = Yup.object({
    otp: Yup.string()
      .required("OTP is required")
      .min(6, "OTP must be 6 digits")
      .max(6, "OTP must be 6 digits"),
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Please confirm your password"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsResetting(true);
      setError("");

      await confirmForgotPassword(
        username,
        values.otp,
        values.newPassword,
        values.confirmPassword
      );

      setIsSuccess(true);
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setIsResetting(false);
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Heading>Password Reset Successful</Heading>
          <Text>Your password has been successfully reset.</Text>
          <Button onClick={() => navigate("/login")} className="w-full">
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <Heading>Reset Password</Heading>
        <Text>Enter the OTP sent to your email and create a new password.</Text>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Formik
          initialValues={{
            otp: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <FormField
                name="otp"
                label="OTP"
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />

              <FormField
                name="newPassword"
                label="New Password"
                type="password"
                autoComplete="new-password"
                required
              />

              <FormField
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isResetting || isSubmitting}
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <Text>
                  Didn't receive the code?{" "}
                  <TextLink to={`/forgot-password`}>Resend Code</TextLink>
                </Text>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordWrapper;
