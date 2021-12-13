import React, { FC } from 'react';
import { Image, Box, Center, Column, Row, ZStack } from 'native-base';
import Typography from '../Typography';
import Icon from '../Icon';
import { CDN_PREFIX } from '../utils';
import { useThemeValue } from '..';

export type TokenProps = {
  src?: string;
  size?: number | string;
  className?: string | null;
  chain?: string;
  name?: string;
  description?: string;
  address?: string;
};

const defaultProps = {
  size: 10,
} as const;

const buildUrl = (src?: string, _chain = '', _address = '') => {
  const chain = _chain.toLocaleLowerCase();
  const address = _address.toLocaleLowerCase();
  if (src) return src;
  if (!chain) return null;
  if (chain && !address) return `${CDN_PREFIX}assets/${chain}/${chain}.png`;
  return `${CDN_PREFIX}assets/${chain}/${address}.png`;
};

const Token: FC<TokenProps> = ({
  src,
  size,
  chain,
  name,
  description,
  address,
}) => {
  const imageUrl = buildUrl(src, chain, address);
  return (
    <Box display="flex" flexDirection="row" alignItems="center">
      <Box>
        {imageUrl ? (
          <Image width={size} height={size} src={imageUrl} alt="Token" />
        ) : (
          <Center
            width={size}
            height={size}
            borderRadius="full"
            bg="background-selected"
          >
            <Icon name="QuestionMarkOutline" />
          </Center>
        )}
      </Box>
      {!!(name || description) && (
        <Box display="flex" ml="2">
          {!!name && <Typography.Body1>{name}</Typography.Body1>}
          {!!description && <Typography.Body2>{description}</Typography.Body2>}
        </Box>
      )}
    </Box>
  );
};

Token.defaultProps = defaultProps;

type TokenGroupSize = 'md' | 'lg' | 'xl';
export type TokenGroupProps = {
  tokens: TokenProps[];
  size: TokenGroupSize;
  cornerToken?: TokenProps;
  name?: string;
  description?: string;
};

type GroupTypeProps = {
  groupSize: number;
  ml_array: string[];
  groupTokenWidth: number[];
  cornerTokenSize: number;
};

const mdProps: GroupTypeProps = {
  groupSize: 24,
  ml_array: ['0px', '20px', '40px', '60px'],
  groupTokenWidth: [28, 48, 68, 88],
  cornerTokenSize: 12,
};

const lgProps: GroupTypeProps = {
  groupSize: 32,
  ml_array: ['0px', '24px', '48px', '72px'],
  groupTokenWidth: [36, 60, 84, 108],
  cornerTokenSize: 16,
};

const xlProps: GroupTypeProps = {
  groupSize: 40,
  ml_array: ['0px', '32px', '64px', '96px'],
  groupTokenWidth: [44, 76, 108, 140],
  cornerTokenSize: 20,
};

function propWithSize(size: TokenGroupSize) {
  switch (size) {
    case 'md':
      return mdProps;
    case 'lg':
      return lgProps;
    default:
      return xlProps;
  }
}

function groupHeight(size: TokenGroupSize, cornerToken?: TokenProps): number {
  const hasCorner = cornerToken != null;
  switch (size) {
    case 'md':
      return hasCorner ? 32 : 28;
    case 'lg':
      return hasCorner ? 41 : 36;
    default:
      return hasCorner ? 50 : 44;
  }
}

function groupTokenWidth(
  tokens: TokenProps[],
  size: TokenGroupSize,
  cornerToken?: TokenProps,
): number {
  const hasCorner = cornerToken != null;
  let width = 0;
  switch (size) {
    case 'md':
      width = mdProps.groupTokenWidth[tokens.length - 1];
      return hasCorner ? width + 4 : width;
    case 'lg':
      width = lgProps.groupTokenWidth[tokens.length - 1];
      return hasCorner ? width + 5 : width;
    default:
      width = xlProps.groupTokenWidth[tokens.length - 1];
      return hasCorner ? width + 6 : width;
  }
}

const TokensView = (
  groupTokens: TokenProps[],
  size: TokenGroupSize,
  cornerToken?: TokenProps,
) => {
  const groupProps = propWithSize(size);
  const borderColor = useThemeValue('surface-subdued');
  const width = groupTokenWidth(groupTokens, size, cornerToken);
  const arrViews = [];
  const hasCorner = cornerToken != null;

  // eslint-disable-next-line react/destructuring-assignment
  for (let i = 0; i < groupTokens.length; i += 1) {
    // eslint-disable-next-line react/destructuring-assignment
    const token = groupTokens[i];
    const height = groupHeight(size, cornerToken);
    const mt = (height - groupProps.groupSize) / 2;

    arrViews.push(
      <Box
        mt={`${hasCorner ? mt : 0}px`}
        ml={groupProps.ml_array[i]}
        borderWidth="2px"
        borderColor={borderColor}
        borderRadius="full"
        padding={0}
        key={i}
      >
        <Token chain={token.chain} size={`${groupProps.groupSize}px`} />
      </Box>,
    );
  }

  const cornerTokenView = hasCorner ? (
    <Box
      mt={0}
      ml={`${width - groupProps.cornerTokenSize - 4}px`}
      borderWidth="2px"
      borderColor={borderColor}
      borderRadius="full"
      padding={0}
      key={5}
    >
      <Token
        chain={cornerToken.chain}
        size={`${groupProps.cornerTokenSize}px`}
      />
    </Box>
  ) : null;
  return (
    <ZStack mt="0" ml={0} width={`${width}px`}>
      {arrViews}
      {cornerTokenView}
    </ZStack>
  );
};

export const TokenGroup: FC<TokenGroupProps> = ({
  tokens,
  size,
  cornerToken,
  name,
  description,
}) => {
  const height = groupHeight(size, cornerToken);
  const tokensView = TokensView(tokens, size, cornerToken);
  const descColor = useThemeValue('text-subdued');
  const hasCorner = cornerToken != null;
  let space = size === 'md' ? 12 : 16;
  if (hasCorner) {
    space -= 4;
  }
  return (
    <Row height={`${height}px`} width="auto">
      {tokensView}
      {!!(name || description) && (
        <Column
          justifyContent="center"
          ml={`${space}px`}
          height={`${height}px`}
        >
          {!!name &&
            (size === 'xl' ? (
              <Typography.Body1>{name}</Typography.Body1>
            ) : (
              <Typography.Body2>{name}</Typography.Body2>
            ))}
          {!!description && (
            <Typography.Body2 color={descColor}>{description}</Typography.Body2>
          )}
        </Column>
      )}
    </Row>
  );
};

export default Token;
