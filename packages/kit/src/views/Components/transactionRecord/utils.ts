import { BigNumber } from 'bignumber.js';

import { TokenType, Transaction } from '@onekeyhq/engine/src/types/covalent';

export function getTransferAmount(transaction: Transaction | null): string {
  let amount = null;

  if (
    transaction?.tokenType === TokenType.ERC20 &&
    transaction?.tokenEvent &&
    transaction.tokenEvent.length > 0
  ) {
    // token transfer
    const tokenEvent = transaction?.tokenEvent[0];
    amount = `${new BigNumber(tokenEvent?.tokenAmount ?? '')
      .dividedBy(new BigNumber(10).pow(tokenEvent?.tokenDecimals ?? 1))
      .decimalPlaces(4)
      .toString()} ${tokenEvent?.tokenSymbol}`;
  } else {
    amount = `${new BigNumber(transaction?.value ?? '')
      .dividedBy(1e18)
      .decimalPlaces(6)
      .toString()} ETH`;
  }
  return amount;
}

export function getTransferAmountFiat(transaction: Transaction) {
  let amountFiat;

  if (
    transaction?.tokenType === TokenType.ERC20 &&
    transaction?.tokenEvent &&
    transaction.tokenEvent.length > 0
  ) {
    // token transfer
    const tokenEvent = transaction?.tokenEvent[0];

    amountFiat = `${new BigNumber(tokenEvent?.deltaQuote ?? '')
      .plus(new BigNumber(transaction?.valueQuote ?? ''))
      .decimalPlaces(2)
      .toString()} USD`;
  } else {
    amountFiat = `${new BigNumber(transaction.valueQuote)
      .decimalPlaces(2)
      .toString()} USD`;
  }
  return amountFiat;
}

export function getFromAddress(transaction: Transaction | null) {
  let fromAddress: string = transaction?.fromAddress ?? '';
  let fromAddressLabel: string | null = transaction?.fromAddressLabel ?? '';
  if (
    transaction?.tokenType === TokenType.ERC20 &&
    transaction.tokenEvent &&
    transaction.tokenEvent.length > 0
  ) {
    fromAddress = transaction.tokenEvent[0].fromAddress;
    fromAddressLabel = transaction.tokenEvent[0].fromAddressLabel;
  }
  return { fromAddress, fromAddressLabel };
}

export function getToAddress(transaction: Transaction | null) {
  let toAddress: string = transaction?.toAddress ?? '';
  let toAddressLabel: string | null = transaction?.toAddressLabel ?? '';
  if (
    transaction?.tokenType === TokenType.ERC20 &&
    transaction.tokenEvent &&
    transaction.tokenEvent.length > 0
  ) {
    toAddress = transaction.tokenEvent[0].toAddress;
    toAddressLabel = transaction.tokenEvent[0].toAddressLabel;
  }
  return { toAddress, toAddressLabel };
}
