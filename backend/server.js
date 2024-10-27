const dotenv = require("dotenv");
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { PDFExtract } = require('pdf.js-extract');
const upload = multer({ dest: path.join(__dirname, 'pdfsummary') });

const app = express();

//accept json data in requests
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // Set the origin to your React app's URL
  res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );
  res.header('Access-Control-Allow-Methods', "GET, OPTIONS, POST, DELETE, PUT, PATCH");

  next();
});

app.use(cors({
  origin: 'http://localhost:3000', // Your React app URL
  credentials: true,
}));

app.options('*', (req, res) => {
  res.sendStatus(200);
});



//environment variables
dotenv.config();

//OpenAIApi Configuration
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const createEmbeddings = require('./utils/createEmbeddings');
const splitTextIntoChunks = require('./utils/splittextintochunks.js');
const generateRandomTableName = require('./utils/generateRandomTableName');
const getEmbedding = require('./utils/getEmbedding');
const getEmbeddings = require('./utils/getEmbeddings');
const findNearestNeighbors = require('./utils/nearestNeighbours.js')

const upload2 = multer({ dest: path.join(__dirname, 'chatwithpdf') });
app.post('/api/uploadPDF', upload2.single('pdf'), async (req, res) => {
  try {
    // res.json({ file: req.file, body: req.body });
    const pdfFile = req.file;

    //extract text from the pdf file
    const pdfExtract = new PDFExtract();

    const extractOptions = {
      firstPage: 1,
      lastPage: undefined,
      password: '',
      verbosity: -1,
      normalizeWhitespace: false,
      disableCombinedTextItems: false
    }

    const data = await pdfExtract.extract(pdfFile.path, extractOptions);

    const pdfText = data.pages.map(page => page.content.map(item => item.str).join(' ')).join(' ');

    //if there is no text extracted return an error
    if (pdfText.length === 0) {
      res.json({ error: "Text could not be extracted from this PDF. Please try another PDF." });
      return;
    }

    // Split the PDF text into chunks
    const chunks = splitTextIntoChunks(pdfText, 512);

    //generate a random table name of 10 characters.
    const table_name = generateRandomTableName();

    //calculate embeddings of the chunks and store them inside a table
   
    await createEmbeddings(chunks, table_name);

    // Return a JSON response with the table name and original name of the pdf file
    res.json({ table_name, filename: pdfFile.originalname });

  } catch (error) {
    console.error('An error occured:', error);
    res.status(500).json({ error });
  }
});

app.post('/api/chatwithPDF', async (req, res) => {
  try {
    const { text, tableName } = req.body;

    async function runCompletion(text, context) {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: [{ role: "system", content: `Answer questions based on information included in the provided context. If the information is not available in the provided context, answer saying that the information is not available in the PDF document. Here is the context: ###${context}###` },
        { role: "user", content: text }],
        temperature: 1,
        max_tokens: 200,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return response;
    }

    //get embedding of text
    
    const embedding = await getEmbedding(text);

    //get embeddings from the tableName table
    const embeddings = await getEmbeddings(tableName);


    //find nearest neighbours
    const nearestNeighbours = findNearestNeighbors({ embedding, embeddings, k: 3 });

    //build the context
    const contextArray = [];
    nearestNeighbours.forEach((neighbour, index) => {
      contextArray.push(`abstract ${index+1}: """${neighbour?.text || ''}"""`);
    })

    const context = contextArray.join(' ');

    // Pass the request text and context to the runCompletion function
    const completion = await runCompletion(text, context);

    // Return the completion as a JSON response
    res.json({ data: completion.data });
  } catch (error) {
    console.error('An error occured', error)
    res.status(500).json({
      error: {
        message: 'An error occurred during your request.',
      }
    });
  }
});

const PORT = process.env.PORT || 500;
app.listen(PORT, console.log(`Server started on port ${PORT}`));