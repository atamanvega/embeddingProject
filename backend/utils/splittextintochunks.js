const { encode } = require('gpt-3-encoder');

const calculateTokens = text => encode(text).length;

const splitSentence = (sentence, maxChunkSize) => {

  //Define an array variable: chunks where we will store all the chunks
  const sentenceChunks = [];

  //Define a string variable: current Chunk where we will store the chunk being built
  //before inserting it into the chunks array
  let partialChunk = "";

  //get all words in the text and store them inside a variable: words
  const words = sentence.split(' ');

  //Loop over the words
  words.forEach(word => {
    //For each word:
    //if the number of tokens in the combination of partialChunk and word < 2000
    //keep adding words to the partialChunk
    //otherwise add the word to the partialChunk and insert ouput into sentenceChunks

    if (calculateTokens(partialChunk + word) < maxChunkSize) {
      partialChunk += word + "."
    } else {
      sentenceChunks.push(partialChunk.trim());
      partialChunk = word + "."; //set the new chunk to the word
    }
  });
  if (partialChunk) {
    sentenceChunks.push(partialChunk.trim());
  }


  //return the sentenceChunks array
  return sentenceChunks;
}

const splitTextIntoChunks = (text, maxChunkSize) => {
    //Define an array variable: chunks where we will store all the chunks
    const chunks = [];
  
    //Define a string variable: current Chunk where we will store the chunk being built
    //before inserting it into the chunks array
    let currentChunk = "";
  
    //get all sentences in the text and store them inside a variable: sentences
    const sentences = text.split('.');
  
    //Loop over the sentences
    sentences.forEach(sentence => {
      //For each sentence:
      //if the number of tokens in the combination of currentChunk and sentence < 512
      //keep adding sentences to the currentChunk
      //otherwise add the sentence to the current chunk and insert ouput into chunks
  
      if (calculateTokens(currentChunk) > maxChunkSize) {
        const sentenceChunks = splitSentence(currentChunk, maxChunkSize);
        chunks.push(...sentenceChunks);
      }
  
      if (calculateTokens(currentChunk + sentence) < maxChunkSize) {
        currentChunk += sentence + "."
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + "."; //set the new chunk to the sentence
      }
    });
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  
  }

  module.exports = splitTextIntoChunks;