import React from 'react';

const DefaultSubagentRenderer = ({ message }) => {
  if (!message) return null;
  return <div>{message.content}</div>;
};

export default DefaultSubagentRenderer;
