// Function to generate a random alphanumeric character
function generateRandomCharacter() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters[randomIndex];
}

// Generate a random table name consisting of 10 characters
function generateRandomTableName() {
    let tableName = '';
    for (let i = 0; i < 10; i++) {
        tableName += generateRandomCharacter();
    }
    return tableName;
}

// Export the generateRandomTableName function
module.exports = generateRandomTableName;