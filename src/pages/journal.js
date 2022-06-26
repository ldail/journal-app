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
  const [selectedFile, setSelectedFile] = useState({});
  const [titleValue, setTitleValue] = useState('');
  const [journalEntryTextValue, setJournalEntryTextValue] = useState('');
  const [submittedVerification, setSubmittedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getJournalEntries = async () => {
    const url = `${REACT_APP_SERVER_URL}/entries`;
    const results = await fetch(url);
    const transformedResults = await results.json();
    // sort when implemented
    console.log(transformedResults);
    const decodedResults = transformedResults.map(result => {
      const journalEntryInfo = result[1].split(',');
      console.log(journalEntryInfo);
      const info = journalEntryInfo.map(item => {
        console.log(item);
        const decrypted = cryptojs.AES.decrypt(item, secretKey).toString(cryptojs.enc.Utf8);
        console.log(decrypted);
        return decrypted;
      });
      return [result[0], info];
    })
    console.log(decodedResults);
    setJournalEntries(decodedResults);
    setHasLoadedJournalEntries(true);
    return transformedResults;
  }

  const startNewEntry = () => {
    setSelectedFile({});
    setTitleValue('');
    setJournalEntryTextValue('');
  }

  const readEntry = async (fileName) => {
    const url = `${REACT_APP_SERVER_URL}/entries/${fileName}`;
    const results = await fetch(url);
    const transformedResults = await results.json();
    const [resultFileName, resultCreationDateTime, resultLastModifiedDateTime, resultSavedJournalEntryText] = transformedResults.split(',');
    const realFileNameDecoded = cryptojs.AES.decrypt(resultFileName, secretKey).toString(cryptojs.enc.Utf8).toString();
    const creationDateTimeDecoded = cryptojs.AES.decrypt(resultCreationDateTime, secretKey).toString(cryptojs.enc.Utf8).toString();
    const lastModifiedDateTimeDecoded = cryptojs.AES.decrypt(resultLastModifiedDateTime, secretKey).toString(cryptojs.enc.Utf8).toString();
    const savedJournalEntryTextDecoded = cryptojs.AES.decrypt(resultSavedJournalEntryText, secretKey).toString(cryptojs.enc.Utf8).toString();
    const fileInfo = {
      realFileName: realFileNameDecoded,
      creationDateTime: creationDateTimeDecoded,
      lastModifiedDateTime: lastModifiedDateTimeDecoded,
      journalEntryText: savedJournalEntryTextDecoded
    };

    //decipher when implemented
    if (realFileNameDecoded === '' || creationDateTimeDecoded === '' || lastModifiedDateTimeDecoded === '' || savedJournalEntryTextDecoded === '') {
      setSecretKey(null);
      setHasLoadedJournalEntries(false);
      setJournalEntries([]);
      return;
    }
    setSelectedFile(fileInfo);
    setTitleValue(fileInfo.realFileName);
    setJournalEntryTextValue(fileInfo.journalEntryText)
  }

  const handleSubmitEntry = async (e, acceptedModal) => {
    if (e) e.preventDefault();
    // Get current file list
    const journalEntries = await getJournalEntries();

    //Check if this will override old titles
    const isCurrentEntryInList = journalEntries.find(fileName => fileName[0] === `${titleValue}`);
    if (isCurrentEntryInList && !acceptedModal) {
      setShowModal(true);
      return;
    }
    let url = `${REACT_APP_SERVER_URL}/entries`;
    let method = 'POST';
    const currentDateTime = (new Date()).toString();
    const fullBody = [
      cryptojs.AES.encrypt(titleValue, secretKey).toString(),
      cryptojs.AES.encrypt(currentDateTime, secretKey).toString(),
      cryptojs.AES.encrypt(currentDateTime, secretKey).toString(),
      cryptojs.AES.encrypt(journalEntryTextValue, secretKey).toString(),
    ];
    if (selectedFile.realFileNameDecoded === titleValue) {
      url = `${REACT_APP_SERVER_URL}/entries/${titleValue}`;
      method = 'PUT';
    }
    const results = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      method,
      body: JSON.stringify(fullBody)
    });
    const transformedResults = await results.json();
    if (!transformedResults?.error) {
      setSubmittedVerification('Submitted');
      startNewEntry();
      getJournalEntries();
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

  const fileIsSelected = !!Object.keys(selectedFile).length

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
      {!!journalEntries.length && 
        <ul>
          {journalEntries.map(file => <li key={file[0]} onClick={() => readEntry(file[0])}>{file[1][0]}</li> )}
        </ul>
      }
    </div>
    }
    <div className="current-entry">
      {hasLoadedJournalEntries &&
      <>
        <h2>{fileIsSelected ? `Editing Entry: ${titleValue}` : 'New Entry'}</h2>
        {fileIsSelected &&
          <button className="new-entry-button" type="button" onClick={startNewEntry}>New Entry</button>}
          <form onSubmit={(e) => handleSubmitEntry(e)}>
              <label htmlFor="entry-title">Entry title:</label>
              <div className="label-for-entry">
                <input type="text" name="entry-title" value={titleValue} onChange={e => setTitleValue(e.target.value)} required />
              </div>
              {fileIsSelected && <div>
                Creation Time: {selectedFile.creationDateTime}
                Last Saved Time: {selectedFile.lastModifiedDateTime}
              </div>
}
            <textarea onChange={e => setJournalEntryTextValue(e.target.value)} value={journalEntryTextValue} required />
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