import React from 'react';

const Modal = ({text, yesButtonText, yesButtonFn, noButtonText, noButtonFn}) => {
  return (
    <div className="modal-container">
      <div className="modal-info">
        <h3>Alert!</h3>
        <div>{text}</div>
        <button type="button" onClick={yesButtonFn}>{yesButtonText}</button>
        <button type="button" onClick={noButtonFn}>{noButtonText}</button>
      </div>
    </div>
  );
};

export default Modal;