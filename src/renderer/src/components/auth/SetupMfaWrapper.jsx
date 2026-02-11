import React, { useState, useContext, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Field, Label, ErrorMessage } from "../../components/ui/fieldset";
import { Heading } from "../../components/ui/heading";
import { Strong, Text } from "../../components/ui/text";
import { AuthLayout } from "../../components/ui/auth-layout";
import { OTPInput } from "input-otp";
import { clsx } from "clsx";
import { useNavigate, useSearchParams } from "react-router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { GlobalContext } from "../../App";
import { setup_mfa, verify_mfa_setup_token } from "../../api/AuthApi";
import QRCode from "react-qr-code";

// Reuse the Slot component from OTPWrapper
function Slot(props) {
  return (
    <div
      className={clsx(
        "relative w-14 h-14 text-[2rem]",
        "flex items-center justify-center",
        "transition-all duration-200",
        "border-border border rounded-md",
        "border-gray-300",
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

// Reuse the FakeCaret component from OTPWrapper
function FakeCaret() {
  return (
    <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div className="w-px h-8 bg-white" />
    </div>
  );
}

const SetupMfaWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const MAX_LENGTH = 6;
  const navigate = useNavigate();
  const [otpError, setOtpError] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [session, setSession] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { setToastOpen, setToastMessage, setToastSeverity } =
    useContext(GlobalContext);

  // Validation schema
  const validationSchema = Yup.object({
    otp: Yup.string()
      .length(MAX_LENGTH, `OTP must be exactly ${MAX_LENGTH} digits`)
      .required("OTP is required"),
  });

  // Fetch MFA setup data on component mount
  useEffect(() => {
    const fetchMfaSetupData = async () => {
      try {
        setIsLoading(true);
        // Get session from URL or use a default one
        const sessionParam = searchParams.get("Session");

        if (sessionParam) {
          setSession(sessionParam);
          // If we have a secret code in the URL, use it directly
          const secretCodeParam = searchParams.get("SecretCode");
          if (secretCodeParam) {
            setSecretCode(secretCodeParam);
            // Generate QR code URL
            const qrData = `otpauth://totp/911Interpreters:${searchParams.get(
              "email"
            )}?secret=${secretCodeParam}&issuer=911Interpreters`;
            setQrCodeUrl(qrData);
            setIsLoading(false);
            return;
          }
        }

        // If no session or secret code in URL, call the setup-mfa API
        const response = await setup_mfa(sessionParam || "");
        setSecretCode(response.SecretCode);
        setSession(response.Session);

        // Generate QR code URL
        const qrData = `otpauth://totp/911Interpreters:${
          response.email || "user"
        }?secret=${response.SecretCode}&issuer=911Interpreters`;
        setQrCodeUrl(qrData);
      } catch (error) {
        console.error("MFA setup error:", error);
        setToastOpen(true);
        setToastSeverity("error");
        setToastMessage(
          error.response?.data?.message ||
            "Failed to setup MFA. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMfaSetupData();
  }, [searchParams, setToastOpen, setToastMessage, setToastSeverity]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setOtpError("");

      // Verify the MFA setup token
      const response = await verify_mfa_setup_token(session, values.otp);

      // Show success message
      setToastOpen(true);
      setToastSeverity("success");
      setToastMessage("MFA setup successful! You can now log in.");

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("MFA verification error:", error);
      setToastOpen(true);
      setToastSeverity("error");
      setToastMessage(
        error.response?.data?.message ||
          "Invalid verification code. Please try again."
      );
      setOtpError(
        error.response?.data?.message ||
          "Invalid verification code. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <Heading>Set Up Two-Factor Authentication</Heading>
        <Text>
          Scan the QR code below with your authenticator app (like Google
          Authenticator, Authy, or Microsoft Authenticator), then enter the
          verification code.
        </Text>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCode value={qrCodeUrl} size={200} />
            </div>

            <div className="text-center mt-2">
              <Text className="font-medium">
                Secret Key (if you can't scan the QR code):
              </Text>
              <Text className="font-mono bg-gray-100 p-2 rounded mt-1 text-sm break-all">
                {secretCode}
              </Text>
            </div>
          </div>
        )}

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
                    <div className="flex gap-2 justify-center">
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
                disabled={
                  isSubmitting || values.otp.length !== MAX_LENGTH || isLoading
                }
              >
                {isSubmitting ? "Verifying..." : "Verify & Complete Setup"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  );
};

export default SetupMfaWrapper;
