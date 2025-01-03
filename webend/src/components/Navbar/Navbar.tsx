import { FC, ReactNode } from 'react'
import "./Navbar.css"

type NavbarProps = {
    children: ReactNode
}

export const Navbar:FC<NavbarProps> = ({ children }) => {
  return (
    <div>
      <nav className="NavbarComp">
        {children}
      </nav>
    </div>
  )
}
