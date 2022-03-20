const express = require("express");
const fs = require("fs");
const configObject = require("../config.json");
const router = express.Router();

const path = "./config.json";
router.post("/fees", (req, res) => {
  let { FeeConfigurationSpec } = req.body;
  let feeObject = [];
  FeeConfigurationSpec = lines(FeeConfigurationSpec);
  FeeConfigurationSpec = FeeConfigurationSpec.map((string) => {
    feeObject.push({
      feeId: string.split(" ")[0],
      feeCurrency: string.split(" ")[1],
      feeLocale: string.split(" ")[2],
      feeEntity: string.split(" ")[3].split("(")[0],
      entityProperty: string.substring(
        string.indexOf("(") + 1,
        string.indexOf(")")
      ),
      feeType: string.split(" ")[6],
      feeValue: string.split(" ")[7],
    });
  });
  fs.unlink(path, function (err) {
    if (err) throw err;
    // if no error, file has been deleted successfully
    console.log("Fee configuration file... deleted!");
    fs.writeFile(path, JSON.stringify(feeObject), (err) => {
      if (err) return err;
    });
    res.send({ FeeConfigurationSpec: feeObject });
  });
});

router.post("/compute-transaction-fee", (req, res) => {
  const { PaymentEntity, Amount: TransactionAmount, Customer } = req.body;
  const transactionLocale = getTransactionLocale(req.body);
  const chargeFee = Customer.BearsFee;
  let AppliedFeeValue = 0;
  let ChargeAmount = 0;
  let getFeeConfigGenericLocale, getFeeEntity, getEntityProperty;
  let getFeeConfigLocale = configObject.filter((co) => {
    if (co.feeLocale === transactionLocale) return co;
  });
  if (!getFeeConfigLocale.length) {
    getFeeConfigLocale = configObject.filter((co) => {
      return getGenericLocale(co, PaymentEntity);
    });
  }
  //   console.log(getFeeConfigLocale, "getFeeConfigLocale");

  if (getFeeConfigLocale.length) {
    getFeeEntity = configObject.filter((co) => {
      return getSpecificFeeEntity(co, PaymentEntity);
    });
  }
  const secondStage = getFeeEntity;

  if (!getFeeEntity.length) {
    getFeeEntity = configObject.filter((co) => {
      returnic(co, PaymentEntity);
    });
  }

  if (getFeeEntity.length) {
    getEntityProperty = configObject.filter((co) => {
      return getSpecificEntityProperty(co, PaymentEntity);
    });
  }
  console.log(getFeeEntity, "getFeeEntitymmkmkm1",secondStage);
  if (!getEntityProperty.length && getFeeEntity.length) {
    getFeeEntity = configObject.filter((co) => {
      return getGenericFeeEntity(co, PaymentEntity);
    });
  }

  console.log(getFeeEntity, "getFeeEntitymmkmkm");

  if (!getEntityProperty.length) {
    console.log("Control reaches here...");
    getEntityProperty = getFeeEntity.filter((co) => {
      return getGenericEntityProperty(co, PaymentEntity);
    });
  }

  console.log(getEntityProperty, "getEntity...");

  if (
    !getFeeConfigLocale.length ||
    !getFeeEntity.length ||
    !getEntityProperty
  ) {
    return res.status(404).send("No Configuration Settings found");
  }
  console.log(getFeeEntity, "getFeeEntity");
  console.log(getEntityProperty, "getEntityProperty");

  AppliedFeeValue =
    getEntityProperty.feeType === "FLAT_PERC"
      ? parseInt(getEntityProperty[0].feeValue.split(":")[0]) +
        (getEntityProperty[0].feeValue.split(":")[1] *
          parseInt(TransactionAmount)) /
          100
      : getEntityProperty[0].feeType === "FLAT"
      ? parseInt(TransactionAmount)
      : getEntityProperty[0].feeType === "PERC"
      ? (getEntityProperty[0].feeValue * parseInt(TransactionAmount)) / 100
      : 0;
  ChargeAmount = chargeFee
    ? parseInt(TransactionAmount) + parseInt(AppliedFeeValue)
    : parseInt(TransactionAmount);

  if (getEntityProperty.length) {
    return res.send({
      AppliedFeeID: getEntityProperty[0].feeId,
      AppliedFeeValue: getEntityProperty[0].feeValue,
      ChargeAmount,
      SettlementAmount: ChargeAmount + parseInt(AppliedFeeValue),
    });
  }
});

function lines(text) {
  let modText = text.split("\n");
  return modText;
}

function getTransactionLocale({ CurrencyCountry, PaymentEntity }) {
  return CurrencyCountry === PaymentEntity.Country ? "LOCL" : "INTL";
}

function getGenericLocale(configObject, transactionObject) {
  for (const key in transactionObject) {
    if (
      configObject.feeLocale !== transactionObject[key] &&
      configObject.feeLocale === "*"
    )
      return configObject;
  }
}

function getGenericFeeEntity(configObject, transactionObject) {
  for (const key in transactionObject) {
    if (
      configObject.feeEntity !== transactionObject[key] &&
      configObject.feeEntity === "*"
    )
      return configObject;
  }
}

function getSpecificFeeEntity(configObject, transactionObject) {
  for (const key in transactionObject) {
    if (configObject.feeEntity === transactionObject[key]) return configObject;
  }
}

function getSpecificEntityProperty(configObject, transactionObject) {
  for (const key in transactionObject) {
    if (configObject.entityProperty === transactionObject[key])
      return configObject;
  }
}
function getGenericEntityProperty(configObject, transactionObject) {
  for (const key in transactionObject) {
    if (
      configObject.entityProperty !== transactionObject[key] &&
      configObject.entityProperty === "*"
    )
      return configObject;
  }
}
module.exports = router;
