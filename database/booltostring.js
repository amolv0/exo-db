const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });


const dynamoDB = new AWS.DynamoDB.DocumentClient();

async function batchUpdateOngoingAttribute(items, batchSize) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const updateParams = {
        TableName: 'event-data',
        Key: {
          'id': item['id'],
          // Include other primary key attributes if necessary
        },
        UpdateExpression: 'SET ongoing = :ongoingVal',
        ExpressionAttributeValues: {
          ':ongoingVal': item.ongoing ? 'true' : 'false',
        }
      };
      return dynamoDB.update(updateParams).promise();
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating batch:', error);
      // Handle error, possibly retry failed updates
    }
  }
}

async function updateAllOngoingAttributes() {
  const params = {
    TableName: 'event-data',
    // Add any necessary parameters for scanning or querying your items
  };

  try {
    const data = await dynamoDB.scan(params).promise();
    await batchUpdateOngoingAttribute(data.Items, 25); // Update in batches of 10
  } catch (error) {
    console.error('Error scanning table:', error);
    throw error;
  }
}

// Usage
updateAllOngoingAttributes().then(() => {
  console.log('Successfully updated items.');
}).catch(error => {
  console.error('Error:', error);
});
