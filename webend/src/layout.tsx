import { FC } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar/Navbar";
import { NavLink } from "./components/Navbar/NavLink";


export const Layout:FC = () => {
    return (
    <>
        <div id="pageContainer">
            <Navbar>
                <NavLink to="/">🏡Home</NavLink>
                <NavLink to="/schematics">🔧Schematics</NavLink>
                <NavLink to="/datasets">🗃️Data Sets</NavLink>
                <NavLink to="/ai">🧠AI Training</NavLink>
                <NavLink style={{marginLeft: 'auto'}} to="/about">About</NavLink>
            </Navbar>
            <div id='pageBody'>
                <Outlet />
            </div>
        </div>
    </>)

}