import * as Headless from '@headlessui/react'
import React from 'react'
import { Link as RouterLink, LinkProps } from 'react-router-dom'

export const Link = React.forwardRef(function Link(
  props: LinkProps & React.RefAttributes<HTMLAnchorElement>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <RouterLink {...props} ref={ref} />
    </Headless.DataInteractive>
  )
})
