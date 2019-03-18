// @flow
import theme from 'shared/theme';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const HasNextPage = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
`;

export const NextPageButton = styled.span`
  display: flex;
  flex: 1;
  justify-content: center;
  padding: 8px;
  background: ${theme.bg.default};
  color: ${theme.text.secondary};
  font-size: 14px;
  font-weight: 500;
  position: relative;
  min-height: 40px;

  &:hover {
    color: ${theme.brand.default};
    cursor: pointer;
    background: rgba(56, 24, 229, 0.1);
  }
`;
