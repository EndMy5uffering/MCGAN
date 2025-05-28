import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { Layout } from './layout'
import { Home } from './pages/home/home'
import { About } from './pages/about/About'
import { SchematicsListPage } from './pages/schematicspage/schematicspage'
import { SchematicView } from './pages/schematicviewpage/schematicViewPage'
import { DataSetslist } from './pages/datasets/DataSetsList'

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import Popper from 'popper.js';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />}/>
        <Route path="/about" element={<About />}/>
        <Route path="/schematics" element={<SchematicsListPage />}/>
        <Route path="/schematics/view" element={<SchematicView />}/>
        <Route path="/ai" element={<div>no page</div>}/>
        <Route path="/datasets" element={<DataSetslist />}/>
        <Route path="*" element={<div>NoPage</div>}/>
        <Route path="/denied" element={<div>Access denied</div>}/>
      </Route>
    </Routes>
  </BrowserRouter>
)
