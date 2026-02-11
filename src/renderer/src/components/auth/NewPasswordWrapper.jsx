import React, { useState, useContext } from "react";
import { Button } from "../../components/ui/button";
import { Field, Label, ErrorMessage } from "../../components/ui/fieldset";
import { Heading } from "../../components/ui/heading";
import { Input } from "../../components/ui/input";
import { Text } from "../../components/ui/text";
import { AuthLayout } from "../../components/ui/auth-layout";
import { useNavigate, useSearchParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { GlobalContext } from "../../App";
import { confirm_new_password } from "../../api/AuthApi";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const NewPasswordWrapper = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passwordError, setPasswordError] = useState("");
  const { login: authLogin } = useAuth();
  const { setToastOpen, setToastMessage, setToastSeverity } =
    useContext(GlobalContext);

  // Validation schema
  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setPasswordError("");
      const session = searchParams.get("Session");
      const email = searchParams.get("Email");
      if (!session || !email) {
        throw new Error("Session/Email information is missing");
      }

      // Call API to confirm new password
      const response = await confirm_new_password(
        email,
        session,
        values.newPassword
      );

      // Update auth context with complete user data if available
      if (response.access_token) {
        authLogin({
          ...response,
          token: response.access_token,
        });
      }

      // Show success message
      setToastOpen(true);
      setToastSeverity("success");
      setToastMessage("Password has been updated successfully!");

      // Redirect based on user role if available, otherwise to login
      if (response.user_type) {
        switch (response.user_type) {
          case "interpreter":
            navigate("/");
            break;
        }
      } else {
        // If no user type is returned, redirect to login
        navigate("/login");
      }
    } catch (error) {
      console.error("Password update error:", error);
      setToastOpen(true);
      setToastSeverity("error");
      setToastMessage(
        error.response?.data?.message ||
          "Failed to update password. Please try again."
      );
      setPasswordError(
        error.response?.data?.message ||
          "Failed to update password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Heading>Create New Password</Heading>
        <Text>
          Your password needs to be updated. Please create a new password that
          meets the requirements below.
        </Text>

        <Formik
          initialValues={{ newPassword: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            handleChange,
            handleBlur,
            isSubmitting,
            errors,
            touched,
          }) => (
            <Form className="grid grid-cols-1 gap-6">
              <Field>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={values.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your new password"
                />
                {touched.newPassword && errors.newPassword && (
                  <ErrorMessage>{errors.newPassword}</ErrorMessage>
                )}
              </Field>

              <Field>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Confirm your new password"
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
                )}
              </Field>

              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}

              <div className="text-sm text-gray-500">
                <p>Password requirements:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>At least 8 characters long</li>
                  <li>Contains at least one uppercase letter</li>
                  <li>Contains at least one lowercase letter</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character (@$!%*?&)</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

export default NewPasswordWrapper;
