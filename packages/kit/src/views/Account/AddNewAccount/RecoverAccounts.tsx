import React, {
  ComponentProps,
  FC,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useIntl } from 'react-intl';
import { ListRenderItem } from 'react-native';

import {
  Box,
  Center,
  CheckBox,
  Divider,
  Empty,
  Modal,
  Spinner,
  Typography,
} from '@onekeyhq/components';
import type {
  Account,
  ImportableHDAccount,
} from '@onekeyhq/engine/src/types/account';
import IconAccount from '@onekeyhq/kit/assets/3d_account.png';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { useAppSelector } from '@onekeyhq/kit/src/hooks/redux';
import {
  CreateAccountModalRoutes,
  CreateAccountRoutesParams,
} from '@onekeyhq/kit/src/routes';
import {
  ModalRoutes,
  ModalScreenProps,
  RootRoutes,
} from '@onekeyhq/kit/src/routes/types';

type NavigationProps = ModalScreenProps<CreateAccountRoutesParams>;

type RouteProps = RouteProp<
  CreateAccountRoutesParams,
  CreateAccountModalRoutes.RecoverAccountsList
>;

type FlatDataType = ImportableHDAccount & {
  selected: boolean;
  isDisabled: boolean;
};

type CellProps = {
  item: FlatDataType;
  index: number;
  onChange: (v: boolean) => void;
} & ComponentProps<typeof Box>;

const CustomCell: FC<CellProps> = ({ item, index, onChange }) => {
  const [isChecked, setIsCheck] = useState(item.selected);
  return (
    <Box
      key={item.path}
      flexDirection="row"
      height="100px"
      bgColor="surface-default"
      justifyContent="space-between"
      borderTopRadius={index === 0 ? '12px' : 0}
    >
      <Box
        flexDirection="column"
        flex={1}
        justifyContent="center"
        paddingLeft="16px"
      >
        <Typography.Body1Strong>{item.displayAddress}</Typography.Body1Strong>
        <Typography.Body2 color="text-subdued">{item.path}</Typography.Body2>
      </Box>
      <Box width="60px" height="100%" justifyContent="center" pl="24px">
        <CheckBox
          isChecked={isChecked}
          isDisabled={item.isDisabled}
          onChange={(isSelected) => {
            setIsCheck(isSelected);
            if (!item.isDisabled && onChange) {
              onChange(isSelected);
            }
          }}
        />
      </Box>
      <Box />
    </Box>
  );
};

type PageStatusType = 'loading' | 'empty' | 'data';
const RecoverAccounts: FC = () => {
  const intl = useIntl();
  const route = useRoute<RouteProps>();
  const { password, walletId, network } = route.params;
  const [currentPage, setCurrentPage] = useState(0);
  const [pageStatus, setPageStatus] = useState<PageStatusType>('loading');
  const navigation = useNavigation<NavigationProps['navigation']>();

  const [flatListData, updateFlatListData] = useState<FlatDataType[]>([]);
  const wallets = useAppSelector((s) => s.wallet.wallets);
  const wallet = wallets.find((w) => w.id === walletId) ?? null;

  const [isVaild, setIsVaild] = useState(false);

  const getActiveAccount = useCallback(async () => {
    let activeAccounts: Account[] = [];
    if (wallet) {
      activeAccounts = await backgroundApiProxy.engine.getAccounts(
        wallet.accounts,
        network,
      );
    }
    return activeAccounts;
  }, [network, wallet]);

  const getData = useCallback(
    async (page: number) => {
      const activeAccounts = await getActiveAccount();
      const limit = 10;
      const start = page * limit;
      const accounts = await backgroundApiProxy.engine.searchHDAccounts(
        walletId,
        network,
        password,
        start,
        limit,
      );
      if (currentPage === 0) {
        setPageStatus(accounts.length > 0 ? 'data' : 'empty');
      }
      updateFlatListData((prev) => [
        ...prev,
        ...accounts.map((item) => {
          const isDisabled =
            activeAccounts.filter((a) => a.path === item.path).length > 0;
          return { ...item, selected: isDisabled, isDisabled };
        }),
      ]);
      return accounts;
    },
    [currentPage, getActiveAccount, network, password, walletId],
  );

  const checkBoxOnChange = useCallback(
    (isSelected: boolean, item: FlatDataType) => {
      flatListData.map((i) => {
        if (i.path === item.path) {
          i.selected = isSelected;
        }
        return i;
      });
      setIsVaild(
        flatListData.filter((i) => !i.isDisabled && i.selected).length > 0,
      );
    },
    [flatListData],
  );

  const renderItem: ListRenderItem<FlatDataType> = useCallback(
    ({ item, index }) => (
      <CustomCell
        item={item}
        index={index}
        borderBottomRadius={index === flatListData.length - 1 ? '12px' : 0}
        onChange={(isSelected) => {
          checkBoxOnChange(isSelected, item);
        }}
      />
    ),
    [checkBoxOnChange, flatListData.length],
  );

  useEffect(() => {
    getData(currentPage);
  }, [currentPage, getData]);

  return (
    <Modal
      height="640px"
      header={intl.formatMessage({ id: 'action__recover_accounts' })}
      headerDescription={`${intl.formatMessage({
        id: 'account__recover_Step_1_of_2',
      })}`}
      onBackActionPress={() => {
        navigation.navigate(RootRoutes.Modal, {
          screen: ModalRoutes.CreateAccount,
          params: {
            screen: CreateAccountModalRoutes.CreateAccountForm,
            params: {
              walletId,
            },
          },
        });
      }}
      primaryActionTranslationId="action__next"
      onPrimaryActionPress={() => {
        navigation.navigate(RootRoutes.Modal, {
          screen: ModalRoutes.CreateAccount,
          params: {
            screen: CreateAccountModalRoutes.RecoverAccountsConfirm,
            params: {
              accounts: [
                ...flatListData.filter((i) => !i.isDisabled && i.selected),
              ],
              walletId,
              network,
            },
          },
        });
      }}
      primaryActionProps={{
        isDisabled: !isVaild,
      }}
      hideSecondaryAction
      // @ts-ignore
      flatListProps={
        pageStatus === 'data'
          ? {
              height: '640px',
              data: flatListData,
              // @ts-ignore
              renderItem,
              ItemSeparatorComponent: () => <Divider />,
              keyExtractor: (item) => (item as ImportableHDAccount).path,
              ListEmptyComponent: (
                <Box flex={1} alignItems="center" justifyContent="center" />
              ),
              onEndReached: () => {
                setCurrentPage((p) => p + 1);
              },
            }
          : undefined
      }
      mt="10px"
    >
      {pageStatus !== 'data' ? (
        <Center h="full" w="full">
          {pageStatus === 'empty' ? (
            <Empty
              imageUrl={IconAccount}
              title={intl.formatMessage({
                id: 'empty__no_account_title',
              })}
              subTitle={intl.formatMessage({
                id: 'empty__no_recoverable_account_desc',
              })}
            />
          ) : (
            <Spinner size="lg" />
          )}
        </Center>
      ) : null}
    </Modal>
  );
};

export default RecoverAccounts;
