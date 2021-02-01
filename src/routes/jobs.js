const express = require("express");
const router = new express.Router();
const hive = require("@hiveio/hive-js");
hive.api.setOptions({url: "https://anyx.io/"});
const fetch = require("node-fetch");

const {
  ACCOUNT,
  WIF,
  MAX_BUY,
  POSTS_PER_DAY,
  POSTING,
  MAX_ACCEPTED_HBD,
  COMMENTS_PER_POST,
  BENEFICIARY
} = process.env;
const auth = require("../middlewares/auth");

router.get("/convert", auth, (req, res) => {
  convert();
  res.sendStatus(200);
});


const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const convert = async () => {
  const bittrexSBD = await (await fetch(
    "https://api.bittrex.com/api/v1.1/public/getticker?market=BTC-HBD"
  )).json();
  const bittrexBTC = await (await fetch(
    "https://api.bittrex.com/api/v1.1/public/getticker?market=USD-BTC"
  )).json();
  console.log(bittrexBTC, bittrexSBD);

  const hbdPrice = (bittrexSBD.result.Last * bittrexBTC.result.Last).toFixed(2);
  console.log(hbdPrice);

  if (hbdPrice > 1.0) {
    return;
  }

  let account = await hive.api.getAccountsAsync([ACCOUNT]);
  const initialHBD = account[0].hbd_balance;
  const hiveBalance = account[0].balance;
  if (parseFloat(hiveBalance) !== 0) {
    const amountBuy = `${Math.min(parseFloat(hiveBalance), MAX_BUY).toFixed(
      3
    )} HIVE`;
    console.log(`Buying ${amountBuy} worth of HBD.`);
    const orderID = getID();
    const expiration = parseInt(new Date().getTime() / 1000 + 10);
    const order = await hive.broadcast.limitOrderCreateAsync(
      WIF,
      ACCOUNT,
      orderID,
      amountBuy,
      "0.001 HBD",
      true,
      expiration
    );
    await timeout(5000);
    account = await hive.api.getAccountsAsync([ACCOUNT]);
    console.log(
      `Bought ${parseFloat(account[0].hbd_balance) -
        parseFloat(initialHBD)} HBD for ${amountBuy}.`
    );
  } else console.log("No HIVE to buy HBD.");
  const hbd = account[0].hbd_balance;
  if (parseFloat(hbd) !== 0) {
    const convert = await hive.broadcast.convertAsync(
      WIF,
      ACCOUNT,
      getID(),
      hbd
    );
    console.log(`Started conversion of ${hbd}.`);
  } else console.log("Nothing to convert!");
};

const getID = () => Math.floor(Math.random() * 10000000);

module.exports = router;
