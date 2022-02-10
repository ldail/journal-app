import React, { useState } from 'react';

const Key = ({setSecretKey}) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSecretKey(keyInput)
  }
  return (
    <div className="modal-container">
      <div className="modal-info">
        <h2>Enter the key</h2>
        <form onSubmit={e => handleSubmit(e)}>
          <input type="password" placeholder="Enter the key here" onChange={e => setKeyInput(e.target.value)} value={keyInput} />
          <div><button type="submit">Submit</button></div>
        </form>
      </div>
    </div>
  );
};

export default Key;