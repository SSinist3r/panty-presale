import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects to swap but only replace the pathname
export function RedirectPathToPresaleOnly({ location }: RouteComponentProps) {
  return <Redirect to={{ ...location, pathname: '/' }} />
}

export default RedirectPathToPresaleOnly
