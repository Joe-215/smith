// @flow
import React, { useState, useEffect } from 'react';
import type { History } from 'react-router-dom';
import { NavigationContext } from 'src/routes';
import Icon from 'src/components/icons';
import { Container, Content, Actions, Title } from './style';

type Props = {
  title: string,
  history: History,
  titlebarIcon?: any,
  titlebarAction?: any,
  titlebarMenuAction: 'view-back' | 'menu',
};

const MobileTitlebar = (props: Props) => {
  const {
    title,
    titlebarIcon,
    titlebarAction,
    titlebarMenuAction,
    history,
  } = props;

  const handleMenuClick = setNavOpen => () => {
    if (titlebarMenuAction === 'menu') {
      return setNavOpen(true);
    }

    if (history.length >= 3) {
      return history.goBack();
    }

    // if there is not history, redirect back to the home view of the app
    // and let the redirect handler push the user to their last-viewed community
    return history.push('/');
  };

  return (
    <NavigationContext.Consumer>
      {({ setNavigationIsOpen }) => (
        <Container hasAction={titlebarAction}>
          <Content>
            <Icon
              onClick={handleMenuClick(setNavigationIsOpen)}
              glyph={titlebarMenuAction}
              size={32}
            />

            <div style={{ width: '12px' }} />

            {titlebarIcon && (
              <React.Fragment>
                {titlebarIcon}
                <div style={{ width: '12px' }} />
              </React.Fragment>
            )}

            <Title>{title}</Title>
          </Content>

          {titlebarAction && <Actions>{titlebarAction}</Actions>}
        </Container>
      )}
    </NavigationContext.Consumer>
  );
};

export default MobileTitlebar;
