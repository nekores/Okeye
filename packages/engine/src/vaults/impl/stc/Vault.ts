/* eslint no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }] */
/* eslint @typescript-eslint/no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }] */
/* eslint-disable @typescript-eslint/require-await */

import { StcClient } from '@onekeyfe/blockchain-libs/dist/provider/chains/stc/starcoin';
import { decrypt } from '@onekeyfe/blockchain-libs/dist/secret/encryptors/aes256';
import {
  PartialTokenInfo,
  UnsignedTx,
} from '@onekeyfe/blockchain-libs/dist/types/provider';
import BigNumber from 'bignumber.js';

import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';

import { NotImplemented, OneKeyInternalError } from '../../../errors';
import { DBSimpleAccount } from '../../../types/account';
import { UserCreateInputCategory } from '../../../types/credential';
import { KeyringSoftwareBase } from '../../keyring/KeyringSoftwareBase';
import {
  IApproveInfo,
  IDecodedTx,
  IDecodedTxActionType,
  IDecodedTxDirection,
  IDecodedTxLegacy,
  IDecodedTxStatus,
  IEncodedTx,
  IEncodedTxUpdateOptions,
  IEncodedTxUpdatePayloadTransfer,
  IEncodedTxUpdateType,
  IFeeInfo,
  IFeeInfoUnit,
  ITransferInfo,
  IUserInputGuessingResult,
} from '../../types';
import { VaultBase } from '../../VaultBase';
import { EVMDecodedTxType } from '../evm/decoder/types';

import { KeyringHardware } from './KeyringHardware';
import { KeyringHd } from './KeyringHd';
import { KeyringImported } from './KeyringImported';
import { KeyringWatching } from './KeyringWatching';
import settings from './settings';

import type { IEncodedTxSTC } from './types';

export default class Vault extends VaultBase {
  settings = settings;

  keyringMap = {
    hd: KeyringHd,
    hw: KeyringHardware,
    imported: KeyringImported,
    watching: KeyringWatching,
  };

  decodedTxToLegacy(decodedTx: IDecodedTx): Promise<IDecodedTxLegacy> {
    const { type, nativeTransfer } = decodedTx.actions[0];
    if (
      type !== IDecodedTxActionType.NATIVE_TRANSFER ||
      typeof nativeTransfer === 'undefined'
    ) {
      // shouldn't happen.
      throw new OneKeyInternalError('Incorrect decodedTx.');
    }

    return Promise.resolve({
      txType: EVMDecodedTxType.NATIVE_TRANSFER,
      symbol: decodedTx.network.symbol,
      amount: nativeTransfer.amount,
      value: nativeTransfer.amountValue,
      network: decodedTx.network,
      fromAddress: nativeTransfer.from,
      toAddress: nativeTransfer.to,
      data: '',
      total: '0', // not available
    } as IDecodedTxLegacy);
  }

  override async decodeTx(
    encodedTx: IEncodedTxSTC,
    _payload?: any,
  ): Promise<IDecodedTx> {
    const network = await this.engine.getNetwork(this.networkId);
    const dbAccount = (await this.getDbAccount()) as DBSimpleAccount;
    const token = await this.engine.getNativeTokenInfo(this.networkId);

    let direction = IDecodedTxDirection.IN;
    if (encodedTx.from === dbAccount.address) {
      direction =
        encodedTx.to === dbAccount.address
          ? IDecodedTxDirection.SELF
          : IDecodedTxDirection.OUT;
    }

    const nativeTransfer = {
      tokenInfo: token,
      from: encodedTx.from,
      to: encodedTx.to,
      amount: new BigNumber(encodedTx.value)
        .shiftedBy(-network.decimals)
        .toFixed(),
      amountValue: encodedTx.value,
      extra: null,
    };

    return Promise.resolve({
      txid: '',
      signer: dbAccount.address,
      nonce: 0,
      actions: [{ type: IDecodedTxActionType.NATIVE_TRANSFER, nativeTransfer }],
      status: IDecodedTxStatus.Pending, // TODO
      direction,
      network,
      feeInfo: {
        price: encodedTx.gasPrice,
        limit: encodedTx.gasLimit,
      },
      extra: null,
    });
  }

  async buildEncodedTxFromTransfer(
    transferInfo: ITransferInfo,
  ): Promise<IEncodedTxSTC> {
    const { from, to, amount, token } = transferInfo;
    if (typeof token !== 'undefined' && token.length > 0) {
      // TODO: token not supported yet.
      throw new NotImplemented();
    }

    const network = await this.getNetwork();
    return Promise.resolve({
      from,
      to,
      value: new BigNumber(amount).shiftedBy(network.decimals).toFixed(),
    });
  }

  async buildEncodedTxFromApprove(
    _approveInfo: IApproveInfo,
  ): Promise<IEncodedTx> {
    throw new NotImplemented();
  }

  updateEncodedTxTokenApprove(
    _encodedTx: IEncodedTxSTC,
    _amount: string,
  ): Promise<IEncodedTxSTC> {
    throw new NotImplemented();
  }

  async updateEncodedTx(
    encodedTx: IEncodedTxSTC,
    payload: any,
    options: IEncodedTxUpdateOptions,
  ): Promise<IEncodedTxSTC> {
    if (options.type === IEncodedTxUpdateType.transfer) {
      const network = await this.getNetwork();
      encodedTx.value = new BigNumber(
        (payload as IEncodedTxUpdatePayloadTransfer).amount,
      )
        .shiftedBy(network.decimals)
        .toFixed();
    }
    return Promise.resolve(encodedTx);
  }

  async buildUnsignedTxFromEncodedTx(
    encodedTx: IEncodedTxSTC,
  ): Promise<UnsignedTx> {
    const dbAccount = (await this.getDbAccount()) as DBSimpleAccount;
    const value = new BigNumber(encodedTx.value);

    const unsignedTx = await this.engine.providerManager.buildUnsignedTx(
      this.networkId,
      {
        inputs: [
          { address: dbAccount.address, value, publicKey: dbAccount.pub },
        ],
        outputs: [{ address: encodedTx.to, value }],
        // TODO: pending support
        // nonce: encodedTx.nonce !== 'undefined' ? decodedTx.nonce : await this.getNextNonce(this.networkId, dbAccount),
        feePricePerUnit: new BigNumber(encodedTx.gasPrice || '1'),
        payload: {},
        ...(typeof encodedTx.gasLimit !== 'undefined'
          ? {
              feeLimit: new BigNumber(encodedTx.gasLimit),
            }
          : {}),
      },
    );

    debugLogger.sendTx(
      'buildUnsignedTxFromEncodedTx >>>> buildUnsignedTx',
      unsignedTx,
    );

    return unsignedTx;
  }

  async fetchFeeInfo(encodedTx: IEncodedTxSTC): Promise<IFeeInfo> {
    // NOTE: for fetching gas limit, we don't want blockchain-libs to fetch
    // other info such as gas price and nonce. Therefore the hack here to
    // avoid redundant network requests.
    const encodedTxWithFakePriceAndNonce = {
      ...encodedTx,
      nonce: 1,
      gasPrice: '1',
    };

    const [network, prices, unsignedTx] = await Promise.all([
      this.getNetwork(),
      this.engine.getGasPrice(this.networkId),
      this.buildUnsignedTxFromEncodedTx(encodedTxWithFakePriceAndNonce),
    ]);

    return {
      nativeSymbol: network.symbol,
      nativeDecimals: network.decimals,
      symbol: network.feeSymbol,
      decimals: network.feeDecimals,

      limit: (unsignedTx.feeLimit || new BigNumber('0')).toFixed(),
      prices,
      defaultPresetIndex: '0',
    };
  }

  async attachFeeInfoToEncodedTx(params: {
    encodedTx: IEncodedTxSTC;
    feeInfoValue: IFeeInfoUnit;
  }): Promise<IEncodedTxSTC> {
    const { price, limit } = params.feeInfoValue;
    if (typeof price !== 'undefined' && typeof price !== 'string') {
      throw new OneKeyInternalError('Invalid gas price.');
    }
    if (typeof limit !== 'string') {
      throw new OneKeyInternalError('Invalid fee limit');
    }

    const network = await this.getNetwork();
    const encodedTxWithFee = {
      ...params.encodedTx,
      gasPrice: new BigNumber(price || '0.000000001')
        .shiftedBy(network.feeDecimals)
        .toFixed(),
      gasLimit: limit,
    };
    return Promise.resolve(encodedTxWithFee);
  }

  async getExportedCredential(password: string): Promise<string> {
    const dbAccount = await this.getDbAccount();
    if (dbAccount.id.startsWith('hd-') || dbAccount.id.startsWith('imported')) {
      const keyring = this.keyring as KeyringSoftwareBase;
      const [encryptedPrivateKey] = Object.values(
        await keyring.getPrivateKeys(password),
      );
      return `0x${decrypt(password, encryptedPrivateKey).toString('hex')}`;
    }
    throw new OneKeyInternalError(
      'Only credential of HD or imported accounts can be exported',
    );
  }

  // Chain only functionalities below.

  async guessUserCreateInput(input: string): Promise<IUserInputGuessingResult> {
    const ret = [];
    if (
      this.settings.importedAccountEnabled &&
      /^(0x)?[0-9a-zA-Z]{64}$/.test(input)
    ) {
      ret.push(UserCreateInputCategory.PRIVATE_KEY);
    }
    if (
      this.settings.watchingAccountEnabled &&
      (await this.engineProvider.verifyAddress(input)).isValid
    ) {
      ret.push(UserCreateInputCategory.ADDRESS);
    }
    return Promise.resolve(ret);
  }

  createClientFromURL(url: string): StcClient {
    return new StcClient(url);
  }

  fetchTokenInfos(
    _tokenAddresses: string[],
  ): Promise<Array<PartialTokenInfo | undefined>> {
    throw new NotImplemented();
  }
}
