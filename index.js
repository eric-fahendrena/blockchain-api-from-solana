const axios = require('axios');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

const apiBaseURL = 'https://api.solana.fm';
const holdersPageSize = 4000;

var tokenAddr = 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm';

(async () => {
  try {
    const response = await axios.get(`https://api.solscan.io/token/${tokenAddr}`);
    console.log(response.data);
    // const data = {
    //   tokenName: response.data.tokenList.name,
    //   symbol: response.data.tokenList.symbol,
    //   image: response.data.tokenList.image
    // }

    // return data;
  } catch (err) {
    console.log('Error:', err);
  }
})();

const getTokenInfo = async () => {
  try {
    const response = await axios.get(`${apiBaseURL}/v1/tokens/${tokenAddr}`);
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
    return response.data;
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
    const perc = (tokenAmount * 100) / currSupply.circulatingSupply;

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

const getDailyPrice = async () => {
  try {
    const tokenInfo = await getTokenInfo();
    let symbol = tokenInfo;
    symbol = symbol.symbol.replace('$', '');
    
    const url = `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=usd`;
    const response = await axios.get(url);
    
    const dtFeeds = await response.data;

    return dtFeeds;
  } catch (err) {
    console.log('Error:', err);
  }
}

(async () => {
  app.get('/api/token/:tokenAddr/market', async (req, res) => {
    tokenAddr = req.params.tokenAddr;
  
    const qualHolders = await getQualHolders();
    const tokenInfo = await getTokenInfo();
    const price = await getDailyPrice();
    const currSupply = await getCurrentSupply();
    const mktCap = await (parseFloat(currSupply.circulatingSupply) * parseFloat(price.USD));
    const qhLength = qualHolders.length;

    res.json({ 
      'Name': tokenInfo.tokenName,
      'Price': price ? price.USD : null,
      'Circulating Supply': currSupply.circulatingSupply,
      'Market Cap': mktCap,
      'Number of Address > 0.1%': qhLength,
      'Top 100 Percentage': qualHolders[qhLength-1][2]
    });
  });

  app.get('/api/token/:tokenAddr/market-overview', async (req, res) => {
    tokenAddr = req.params.tokenAddr;
    
    const mktOverview = await getMarketOverview();

    res.json(mktOverview);
  });
})();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server running on port', port);
});
