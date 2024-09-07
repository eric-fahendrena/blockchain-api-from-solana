const axios = require('axios');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

const apiBaseURL = 'https://api.solana.fm';
const holdersPageSize = 500;

var tokenAddr = '';

const getTokenInfo = async () => {
  try {
    const response = await axios.get(`${apiBaseURL}/v1/tokens/${tokenAddr}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = {
      tokenName: response.data.tokenList.name,
      symbol: response.data.tokenList.symbol,
      image: response.data.tokenList.image
    }

    return data;
  } catch (err) {
    console.log('Error:', err);
  }
}

const getCurrentSupply = async () => {
  try {
    const response = await axios.get(`${apiBaseURL}/v1/tokens/${tokenAddr}/supply`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data.circulatingSupply;
  } catch (err) {
    console.log('Error:', err);
  }
}

const getTokenAccounts = async () => {
  try {
    const response = await axios.get(`${apiBaseURL}/v1/tokens/${tokenAddr}/holders?pageSize=${holdersPageSize}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data.tokenAccounts;
  } catch (err) {
    console.log('Error:', err);
  }
}

const getQualHolders = async () => {
  const tokenAccounts = await getTokenAccounts();
  const currSupply = await getCurrentSupply();
  const qualPerc = 0.1;
  const qualHolders = [];
  
  let top100perc = 0.0;
  
  let shouldStop = false;
  for (let i = 0; i < tokenAccounts.length; i++) {
    const tokenAmount = tokenAccounts[i].info.tokenAmount.uiAmount;
    const perc = (tokenAmount * 100) / currSupply;

    if (perc < qualPerc) {
      shouldStop = true;
      break;
    }
    qualHolders.push([ [tokenAccounts[i]], perc.toFixed(2)+'%', top100perc.toFixed(2)+'%' ]);
    
    if (qualHolders.length <= 100) {
      top100perc += perc;
    }
  }

  return qualHolders;
}

(() => {

  app.get('/api/token/:tokenAddr/q-holders-info', async (req, res) => {
    tokenAddr = req.params.tokenAddr;
  
    const qualHolders = await getQualHolders();
    const tokenInfo = await getTokenInfo();
    const qhLength = qualHolders.length;
    res.json({ 'Name': tokenInfo.tokenName, 'Number': qhLength, 'Percentage': qualHolders[qhLength-1][1], 'Top 100 Percentage': qualHolders[qhLength-1][2] });
  });
})();

const port = 3000;
app.listen(port, () => {
  console.log('Server running on port', port);
});
