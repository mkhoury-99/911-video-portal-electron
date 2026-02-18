import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Field, Label, ErrorMessage } from "../../components/ui/fieldset";
import { Heading } from "../../components/ui/heading";
import { Input } from "../../components/ui/input";
import { Text, TextLink } from "../../components/ui/text";
import { AuthLayout } from "../../components/ui/auth-layout";
import { useNavigate } from "react-router-dom";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import { requestForgotPasswordOtp } from "../../api/AuthApi";

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

const ForgotPasswordWrapper = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  // Validation schema
  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setIsLoading(true);
      setError("");

      await requestForgotPasswordOtp(values.username);

      setUsername(values.username);
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to send reset code. Please try again."
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout>
        <div className="flex flex-col space-y-6">
          <Heading>Check Your Email</Heading>
          <Text>
            We've sent a password reset code to your email address. Please check
            your inbox and enter the code below.
          </Text>
          <Button
            onClick={() =>
              navigate(
                `/reset-password?username=${encodeURIComponent(username)}`
              )
            }
            className="w-full"
          >
            Enter Reset Code
          </Button>
          <div className="text-center">
            <Text>
              Didn't receive the code?{" "}
              <TextLink onClick={() => setIsSubmitted(false)}>
                Resend Code
              </TextLink>
            </Text>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <Heading>Forgot Password</Heading>
        <Text>
          Enter your username and we'll send you a code to reset your password.
        </Text>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Formik
          initialValues={{ username: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <FormField
                name="username"
                label="Username"
                type="text"
                autoComplete="username"
                required
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>

              <div className="text-center">
                <Text>
                  Remember your password?{" "}
                  <TextLink to="/login">Sign In</TextLink>
                </Text>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordWrapper;
