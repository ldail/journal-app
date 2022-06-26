import React, { useState } from 'react';
import { useEffect } from 'react/cjs/react.development';
import Key from './key';
import Modal from './modal';
import cryptojs from 'crypto-js';

const {REACT_APP_SERVER_URL} = process.env;

const Journal = () => {
  const [secretKey, setSecretKey] = useState(null);
  const [hasLoadedJournalEntries, setHasLoadedJournalEntries] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [titleValue, setTitleValue] = useState('');
  const [journalEntryText, setJournalEntryText] = useState('');
  const [submittedVerification, setSubmittedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getJournalEntries = async () => {
    const url = `${REACT_APP_SERVER_URL}/entries`;
    const results = await fetch(url);
    const transformedResults = await results.json();
    // sort when implemented
    console.log(transformedResults);
    const bytesMap = transformedResults.map(result => {
      const byte = cryptojs.AES.decrypt(result, secretKey);
      return byte.toString(cryptojs.enc.Utf8);
    });
    console.log(bytesMap);
    setJournalEntries(bytesMap);
    setHasLoadedJournalEntries(true);
    return transformedResults;
  }

  const startNewEntry = () => {
    setSelectedFileName(null);
    setTitleValue('');
    setJournalEntryText('');
  }

  const readEntry = async (entry) => {
    const url = `${REACT_APP_SERVER_URL}/entries/${entry}`;
    const results = await fetch(url);
    const transformedResults = await results.json();
    const bytes = cryptojs.AES.decrypt(transformedResults, secretKey);
    const decodedInfo = bytes.toString(cryptojs.enc.Utf8);

    //decipher when implemented
    const resultsFromBuffer = decodedInfo.toString();
    if (resultsFromBuffer === '') {
      setSecretKey(null);
      setHasLoadedJournalEntries(false);
      setJournalEntries([]);
      return;
    }
    const withoutExtension = entry.slice(0,entry.length-4)
    setSelectedFileName(withoutExtension);
    setTitleValue(withoutExtension);
    setJournalEntryText(resultsFromBuffer);
  }

  const handleSubmitEntry = async (e, acceptedModal) => {
    if (e) e.preventDefault();
    // Get current file list
    const journalEntries = await getJournalEntries();

    //Check if this will override old titles
    const isCurrentEntryInList = journalEntries.find(fileName => fileName === `${titleValue}.txt`);
    if (isCurrentEntryInList && !acceptedModal) {
      setShowModal(true);
      return;
    }
    let url = `${REACT_APP_SERVER_URL}/entries`;
    let method = 'POST';
    const reqBody = {
      title: cryptojs.AES.encrypt(titleValue, secretKey).toString(),
      entryText: cryptojs.AES.encrypt(journalEntryText, secretKey).toString()
    };
    if (selectedFileName === titleValue) {
      url = `${REACT_APP_SERVER_URL}/entries/${titleValue}`;
      method = 'PUT';
    }
    const results = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      method,
      body: JSON.stringify(reqBody)
    });
    const transformedResults = await results.json();
    if (!transformedResults?.error) {
      setSubmittedVerification('Submitted');
      startNewEntry();
      await getJournalEntries();
    }
    else {
      setSubmittedVerification('error');
    }
  }

  const acceptModal = () => {
    setShowModal(false);
    handleSubmitEntry(null, true);
  }

  const denyModal = () => {
    setShowModal(false);
  }

  useEffect(() => {
    if (submittedVerification) {
      setTimeout(() => {
        setSubmittedVerification(false);
      }, 5000)
    }
  }, [submittedVerification]);

  return (
    <div className="journal">
    {!secretKey
    ? <Key
        setSecretKey={setSecretKey}
      />
    :
    <div className="entries">
      <h2>Journal Entries</h2>
      <button onClick={getJournalEntries}>Get journal entries</button>
      <ul>
        {journalEntries.map(fileName => <li key={fileName} onClick={() => readEntry(fileName)}>{fileName}</li> )}
      </ul>
    </div>
    }
    <div className="current-entry">
      {hasLoadedJournalEntries &&
      <>
        <h2>{selectedFileName ? `Editing Entry: ${selectedFileName}` : 'New Entry'}</h2>
        {selectedFileName &&
          <button className="new-entry-button" type="button" onClick={startNewEntry}>New Entry</button>}
          <form onSubmit={(e) => handleSubmitEntry(e)}>
              <label htmlFor="entry-title">Entry title:</label>
              <div className="label-for-entry">
                <input type="text" name="entry-title" value={titleValue} onChange={e => setTitleValue(e.target.value)} required />
                <span>.txt</span>
              </div>
            <textarea onChange={e => setJournalEntryText(e.target.value)} value={journalEntryText} required />
            <button type="submit">Submit entry</button>
          </form>
          <div className="verification-text" style={{backgroundColor: submittedVerification ? 'yellow' : 'white'}}>{submittedVerification}</div>
      </>
      }
    </div>
    {showModal &&
      <Modal
        yesButtonText="ok"
        yesButtonFn={acceptModal}
        noButtonText="cancel"
        noButtonFn={denyModal}
        text="This file name already exists. If you click 'ok', the entire file will be overwritten."
      />
    }
    </div>
  );
};

export default Journal;