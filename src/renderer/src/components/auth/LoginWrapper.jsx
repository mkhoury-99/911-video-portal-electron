import React, { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Field, Label, ErrorMessage } from '../../components/ui/fieldset'
import { Heading } from '../../components/ui/heading'
import { Input } from '../../components/ui/input'
import { Strong, Text } from '../../components/ui/text'
import { AuthLayout } from '../../components/ui/auth-layout'
import { Link, useNavigate } from 'react-router-dom'
import { initiate_login, setup_mfa } from '../../api/AuthApi'
import { Formik, Form, useField } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'
// Custom form field component that works with Formik
const FormField = ({ label, ...props }) => {
  const [field, meta] = useField(props)
  const hasError = meta.touched && meta.error

  return (
    <Field>
      <Label>{label}</Label>
      <Input {...field} {...props} className={hasError ? 'border-red-500' : ''} />
      {hasError && <ErrorMessage>{meta.error}</ErrorMessage>}
    </Field>
  )
}

const LoginWrapper = () => {
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState('')

  // Validation schema using Yup
  const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required')
  })

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoginError('')
      let response = await initiate_login(values.username, values.password)

      // if (response.ChallengeName === "SOFTWARE_TOKEN_MFA") {
      //   navigate("/otp?email=" + values.email + "&session=" + response.Session);
      // } else

      authLogin({
        ...response,
        token: response.token,
        customer_name: response.customer_name
        // isAuthenticated is determined by the presence of a user in the context
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setLoginError(error.response?.data?.message || 'Login failed. Please try again.')
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="grid w-full max-w-sm grid-cols-1 gap-8">
        <img src={logo} width={300} alt="911 Interpreters Logo" />
        <Heading>Sign in to Customer Video Portal</Heading>

        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="grid grid-cols-1 gap-6">
              <FormField label="Username" type="text" name="username" placeholder="john.doe" />

              <FormField
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••••••"
              />

              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}

              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 font-medium shadow-sm hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </AuthLayout>
  )
}

export default LoginWrapper
