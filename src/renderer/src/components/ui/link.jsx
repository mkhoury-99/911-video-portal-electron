import * as Headless from '@headlessui/react'
import React, { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export const Link = forwardRef(function Link({ to, ...props }, ref) {
  if (to) {
    return (
      <Headless.DataInteractive>
        <RouterLink to={to} {...props} ref={ref} />
      </Headless.DataInteractive>
    )
  }
  
  return (
    <Headless.DataInteractive>
      <a {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
