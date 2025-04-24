import React from 'react';
import Navbar from './Navbar';
import styles from '../../styles/layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      <Navbar />
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
