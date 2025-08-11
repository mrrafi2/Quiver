import React from 'react';
import styles from '../../styles/layout.module.css';

const Layout = ({ children }) => {
  return (
    <div className={styles.layoutContainer}>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
