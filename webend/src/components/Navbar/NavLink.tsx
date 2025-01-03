import { ReactNode } from "react"
import { Link } from "react-router-dom"
import "./NavLink.css"

import '../../scss/styles.scss'
import * as _bootstrap from 'bootstrap'

export interface NavLinkProps{
    to: string
    children: ReactNode
    style?: React.CSSProperties
}

export const NavLink = (props: NavLinkProps) => {
    return (
        <Link className="nav-link" style={props.style} to={props.to}>{props.children}</Link>
    )
}
