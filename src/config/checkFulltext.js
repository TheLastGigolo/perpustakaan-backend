const db = require('./database');

/**
 * Function to check if the fulltext index exists and create it if it doesn't
 */
async function checkAndCreateFulltextIndex() {
  try {
    // Check if FULLTEXT index exists on books table
    const [indexes] = await db.query(`
      SHOW INDEX FROM books 
      WHERE Key_name = 'ft_search' 
      AND Index_type = 'FULLTEXT'
    `);
    
    // If FULLTEXT index doesn't exist, create it
    if (indexes.length === 0) {
      console.log('Creating FULLTEXT index on books table...');
      
      await db.query(`
        ALTER TABLE books 
        ADD FULLTEXT INDEX ft_search (title, author, description)
      `);
      
      console.log('FULLTEXT index created successfully');
    } else {
      console.log('FULLTEXT index already exists');
    }
  } catch (error) {
    console.error('Error checking/creating FULLTEXT index:', error);
    throw error;
  }
}

module.exports = { checkAndCreateFulltextIndex };