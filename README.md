# Blockchain API from Solana

This API allows to get some important details of a specified token.

## Routes

- `GET` : `https://solana-api-test.vercel.app/api/token/:token-addr/q-holders-info`
  
  ```json
  {
    "Name":"[token name]",
    "Number": "[number of address holding >= 0.10%]",
    "Percentage": "[percentage]",
    "Top 100 Percentage":"[top 100 percentage]"
  }
  ```
