import React, { useState, useContext } from "react";
import { Button } from "../../components/ui/button";
import { Checkbox, CheckboxField } from "../../components/ui/checkbox";
import { Field, Label, ErrorMessage } from "../../components/ui/fieldset";
import { Heading } from "../../components/ui/heading";
import { Input } from "../../components/ui/input";
import { Strong, Text, TextLink } from "../../components/ui/text";
import { AuthLayout } from "../../components/ui/auth-layout";
import { OTPInput } from "input-otp";
import { clsx } from "clsx";
import { useNavigate, useSearchParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { GlobalContext } from "../../App";
import { verify_otp } from "../../api/AuthApi";
// Feel free to copy. Uses @shadcn/ui tailwind colors.

function Slot(props) {
  return (
    <div
      className={clsx(
        "relative w-14 h-14 text-[2rem]",
        "flex items-center justify-center",
        "transition-all duration-200",
        "border-border border rounded-md",
        "border-gray-300",
        // "group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20",
        "outline-0 outline-accent-foreground/20",
        { "outline-2 outline-accent-foreground": props.isActive }
      )}
    >
      <div className="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
        {props.char ?? props.placeholderChar}
      </div>
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  );
}

// You can emulate a fake textbox caret!
function FakeCaret() {
  return (
    <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div className="w-px h-8 bg-white" />
    </div>
  );
}

const OTPWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const MAX_LENGTH = 6;
  const navigate = useNavigate();
  const [otpError, setOtpError] = useState("");
  const { login: authLogin } = useAuth();
  const { setToastOpen, setToastMessage, setToastSeverity } =
    useContext(GlobalContext);

  // Validation schema
  const validationSchema = Yup.object({
    otp: Yup.string()
      .length(MAX_LENGTH, `OTP must be exactly ${MAX_LENGTH} digits`)
      .required("OTP is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setOtpError("");
      // Here you would normally verify the OTP with your backend
      let response = await verify_otp(
        searchParams.get("email"),
        searchParams.get("session"),
        values.otp
      );
      // console.log("OTP submitted:", values.otp);

      // After OTP verification, fetch user data including role
      // const userData = await get_user_type();
      console.log("verify_otp", response);

      // Update auth context with complete user data
      authLogin({
        ...response,
        token: response.access_token,
        // isAuthenticated is determined by the presence of a user in the context
      });

      // setToastOpen(true);
      // setToastSeverity("success");
      // setToastMessage("Login successful!");
      // console.log(response);
      // Redirect based on user role
      switch (response.user_type) {
        case "interpreter":
          navigate("/");
          break;
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setToastOpen(true);
      setToastSeverity("error");
      setToastMessage(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
      setOtpError(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Heading>Enter your OTP</Heading>
        <Text>
          Enter the verification code sent to your email to complete the login
          process.
        </Text>

        <Formik
          initialValues={{ otp: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isSubmitting, errors, touched }) => (
            <Form className="grid grid-cols-1 gap-6">
              <Field>
                <Label>Verification Code</Label>
                <OTPInput
                  value={values.otp}
                  inputMode="numeric"
                  onChange={(otp) => setFieldValue("otp", otp)}
                  maxLength={MAX_LENGTH}
                  containerClassName="group flex items-center has-[:disabled]:opacity-30 mt-2"
                  render={({ slots }) => (
                    <div className="flex gap-2">
                      {slots.slice(0, MAX_LENGTH).map((slot, idx) => (
                        <Slot key={idx} {...slot} />
                      ))}
                    </div>
                  )}
                />
                {touched.otp && errors.otp && (
                  <ErrorMessage>{errors.otp}</ErrorMessage>
                )}
              </Field>

              {otpError && (
                <div className="text-red-600 text-sm">{otpError}</div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || values.otp.length !== MAX_LENGTH}
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

export default OTPWrapper;
