import React, { useState, useEffect } from 'react';
import './style/style.css';
import axios from 'axios';

function PDFChat() {
    const [jresult, setJresult] = useState('');
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [buttonPromptLoading, setButtonPromptLoading] = useState(false);
    const [tableName, setTableName] = useState('');
    const [fileName, setFileName] = useState('');
    const [messages, setMessages] = useState([
        { role: "system", content: "You are an assistant" }
    ]);
    const [inputMessage, setInputMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessages([
            { role: "system", content: "You are an assistant" }
        ]);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('pdf', selectedFile);

            const response = await axios.post('/api/uploadPDF', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.error) {
                setError(response.data.error);
                return;
            }
            setError('');
            setJresult(JSON.stringify(response.data, null, 2));
            setTableName(response.data.table_name);
            setFileName(response.data.filename);

        } catch (error) {
            console.log(error);
            setError('An error occurred while submitting the form.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPrompt = async (e) => {
        e.preventDefault();
        //Send a request to the server only if there is  a user message
        if (inputMessage.trim() !== "") {
            try {
                //clear input
                setInputMessage('');
                //Add the user message to the messages array
                const updatedMessages = [...messages, { role: "user", content: inputMessage }]
                setMessages(updatedMessages);
                const response = await axios.post('/api/chatwithPDF', { text: inputMessage, tableName });
                const serverResponse = response.data;

                //Add the server response to the messages array
                const updatedMessages2 = [...updatedMessages, { role: "assistant", content: serverResponse.data.choices[0].message.content }]
                setMessages(updatedMessages2);

                setButtonPromptLoading(true);
                
                //Update jresult with the udpates messages array
                setJresult(JSON.stringify(updatedMessages2, null, 2));
            } catch (error) {
                console.log('An error occured', error);
                setError('An error occured');
            } finally {
                setButtonPromptLoading(false);
            }
        }

    };

    //scroll to the bottom of the chatContainer whenever the messages array changes
    useEffect(() => {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            const scrollOptions = {
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            }
            chatContainer.scrollTo(scrollOptions);
        }
    }, [messages]);

    return (
        <div>
            <div className='container d-flex flex-column' style={{ height: '100vh' }}>
                <div className='hero d-flex align-items-center justify-content-center text-center flex-column p-3'>
                    <h1 className='display-4'>Talk to Your PDFs.</h1>
                    <p className='lead'>Break the Boundaries: Discover a New Dimension of Interaction!</p>
                    <form className='w-100' onSubmit={handleSubmit}>
                        <input type='file' accept='.pdf' onChange={handleFileChange}></input>
                        <div className="form-group row">
                            <div className='col-sm-4 offset-sm-4 mt-3'>
                            </div>
                            <button
                                type='submit'
                                disabled={!selectedFile || loading}
                                className='btn btn-primary custom-button mt-1'
                            >
                                {loading ? 'Analysing PDF...' : 'Upload PDF'}

                            </button>
                        </div>

                    </form>
                </div>
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                {tableName && (
                    <>
                        <h2 className='mt-3'>Ask me anything about {fileName}</h2>
                        <div className='flex-fill'>
                            <div className='flex-fill chatContainer' id='chatContainer'>
                                {messages.map((message, index) => message.role !== "system" && (
                                    <div
                                        key={index}
                                        className={`${message.role === 'user' ? 'alert alert-info' : 'alert alert-success'}`}
                                    >
                                        {message.content}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <form className="form-horizontal mb-3 container-fluid" onSubmit={handleSubmitPrompt}>
                            <div className="form-group row">
                                <div className="col-sm-11 mt-2">
                                    <div className="form-floating">
                                        <input
                                            className="form-control custom-input"
                                            id="floatingInput"
                                            placeholder="Enter a value"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                        />

                                        <label htmlFor="floatingInput">Input</label>
                                    </div>
                                </div>
                                <div className="col-sm-1 mt-2">
                                    <button type="submit" className="btn btn-primary custom-button">
                                        {buttonPromptLoading ? (<span className='spinner-border spinner-border-sm' role='status' aria-hidden="true"></span>) : ('Submit')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </div>
            {jresult && (
                <pre className="alert alert-info mt-3">
                    <code>{jresult}</code>
                </pre>
            )}
        </div>
    );
}

export default PDFChat;
