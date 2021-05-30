# Coin-Tunnel
An open source crypto payment system
(Currently running on the bitcoin Testnet)
# Want to replicate this?
Create a mongodb database called "cointunnel"
Create collections called "emails" "err-transactions" "finished-transactions" "keys" "merchantData" "open-transactions" "userData"
Get oauth2 keys from google, github, and discord
Rename config.json.example to config.json
Rename secret.json.example to secret.json

Add your secret and public keys to those files.

# Docs https://docs.coin-tunnel.ml/

# Wish list

 Make buyer dashboard automatically update with websockets
 
 Add support for more coins (LTC is done, ETH is half done, and XRP is in the pipes)
 
 Make dashboard look better

# To-Do list
## Buyers
  ~~Buyer signin/signup~~
  
  ~~Buyer Dashboard~~
  
  ~~Connect buyer wallet~~
  
  ~~Host cloud wallets for buyer~~
  
 ## Sellers
  ~~Seller signin/signup~~
  
  ~~Seller dashboard~~
  
 ## Payment system
  ~~Emails~~
  
  ~~Http callbacks~~
  
  ~~withdrawal/deposits~~
  
  ~~Garbage collection~~
  
 ## Extra endpoints
  ~~Get extra info for tx~~
  
  ~~Get all tx's made by merchant~~
