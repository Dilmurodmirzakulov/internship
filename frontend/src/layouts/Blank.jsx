import React from 'react';

export const Blank = ({ children }) => {
  return (
    <div className="layout-wrapper layout-content-navbar layout-without-menu">
      <div className="layout-container">
        <div className="layout-page">
          <div className="content-wrapper">{children}</div>
        </div>
      </div>
    </div>
  );
};
