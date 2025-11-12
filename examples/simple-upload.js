/**
 * Simple Galaksio Client Example (Node.js)
 *
 * This example shows how to upload a file to Pinata via the Galaksio broker.
 *
 * NOTE: This is a simplified example for testing WITHOUT payment.
 * For production, you need to implement the x402 payment flow.
 */

const axios = require('axios');

const BROKER_URL = 'http://localhost:8080';

async function uploadToPinata(fileUrl, fileName) {
  console.log('🚀 Uploading file to Pinata via Galaksio...');
  console.log('File URL:', fileUrl);
  console.log('File Name:', fileName);

  try {
    // Step 1: Send task to broker
    const response = await axios.post(`${BROKER_URL}/run`, {
      taskType: 'storage',
      fileUrl: fileUrl,
      provider: 'pinata',
      meta: {
        name: fileName,
        timestamp: new Date().toISOString()
      }
    });

    console.log('\n✅ Upload successful!');
    console.log('Job ID:', response.data.jobId);
    console.log('Status:', response.data.status);
    console.log('Result:', JSON.stringify(response.data.result, null, 2));

    return response.data;

  } catch (error) {
    if (error.response?.status === 402) {
      console.log('\n💰 Payment required!');
      console.log('Payment details:', JSON.stringify(error.response.data, null, 2));
      console.log('\nTo proceed:');
      console.log('1. Pay', error.response.data.accepts[0].maxAmountRequired, 'USDC to', error.response.data.accepts[0].payTo);
      console.log('2. Get transaction hash');
      console.log('3. Retry with x-payment header containing proof');
    } else {
      console.error('\n❌ Upload failed:', error.response?.data || error.message);
    }
    throw error;
  }
}

async function checkJobStatus(jobId) {
  console.log('\n🔍 Checking job status for:', jobId);

  try {
    const response = await axios.get(`${BROKER_URL}/status/${jobId}`);
    console.log('Job status:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to check status:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function main() {
  const fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const fileName = 'test-document.pdf';

  try {
    const result = await uploadToPinata(fileUrl, fileName);

    // Optionally check status
    if (result.jobId) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await checkJobStatus(result.jobId);
    }
  } catch (error) {
    // Error already logged
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { uploadToPinata, checkJobStatus };
