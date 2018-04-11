// @flow
import * as React from 'react';
import type { GetCurrentUserSettingsType } from 'shared/graphql/queries/user/getCurrentUserSettings';
import UserEditForm from './editForm';
import EmailSettings from './emailSettings';
import NotificationSettings from './notificationSettings';
import Invoices from './invoices';
import { SectionsContainer, Column } from 'src/components/settingsViews/style';

type Props = {
  user: GetCurrentUserSettingsType,
};

class Overview extends React.Component<Props> {
  render() {
    const { user } = this.props;

    return (
      <SectionsContainer>
        <Column>
          <UserEditForm user={user} />
        </Column>
        <Column>
          <EmailSettings currentUser={user} />
          {'serviceWorker' in navigator &&
            'PushManager' in window && <NotificationSettings largeOnly />}
          <Invoices id={user.id} />
        </Column>
      </SectionsContainer>
    );
  }
}

export default Overview;
