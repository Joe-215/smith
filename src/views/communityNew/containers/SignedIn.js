// @flow
import React, { useEffect } from 'react';
import compose from 'recompose/compose';
import { connect } from 'react-redux';
import generateMetaInfo from 'shared/generate-meta-info';
import { withCurrentUser } from 'src/components/withCurrentUser';
import Head from 'src/components/head';
import type { SignedInMemberType } from '../types';
import { CommunityProfileHeader } from '../components/CommunityProfileHeader';
import { MobileCommunityProfileHeader } from '../components/MobileCommunityProfileHeader';
import { TeamMembersList } from '../components/TeamMembersList';
import { CommunityFeeds } from '../components/CommunityFeeds';
import { ChannelsList } from '../components/ChannelsList';
import {
  Container,
  TwoColumnGrid,
  Main,
  Sidebar,
  SidebarSection,
} from '../style';

const Component = (props: SignedInMemberType) => {
  const { community } = props;

  let containerEl = null;

  useEffect(() => {
    containerEl = document.getElementById('scroller-for-thread-feed');
  }, []);

  const { title, description } = generateMetaInfo({
    type: 'community',
    data: {
      name: community.name,
      description: community.description,
    },
  });

  const scrollToTop = () => {
    if (containerEl) return containerEl.scrollTo(0, 0);
  };

  const scrollToBottom = () => {
    console.log('scrolling to bottom');
    if (containerEl) {
      containerEl.scrollTop =
        containerEl.scrollHeight - containerEl.clientHeight;
    }
  };

  const scrollToPosition = (position: number) => {
    if (containerEl) {
      containerEl.scrollTop = position;
    }
  };

  const contextualScrollToBottom = () => {
    if (
      containerEl &&
      containerEl.scrollHeight - containerEl.clientHeight <
        containerEl.scrollTop + 280
    ) {
      scrollToBottom();
    }
  };

  return (
    <React.Fragment>
      <Head
        title={title}
        description={description}
        image={community.profilePhoto}
      />

      <Container data-cy="community-view">
        <TwoColumnGrid>
          <Main>
            <MobileCommunityProfileHeader community={community} />
            <CommunityFeeds
              scrollToBottom={scrollToBottom}
              contextualScrollToBottom={contextualScrollToBottom}
              scrollToTop={scrollToTop}
              scrollToPosition={scrollToPosition}
              community={community}
            />
          </Main>

          <Sidebar>
            <SidebarSection>
              <CommunityProfileHeader community={community} />
            </SidebarSection>

            <SidebarSection>
              <TeamMembersList
                community={community}
                id={community.id}
                first={100}
                filter={{ isModerator: true, isOwner: true }}
              />
            </SidebarSection>

            <SidebarSection>
              <ChannelsList id={community.id} communitySlug={community.slug} />
            </SidebarSection>
          </Sidebar>
        </TwoColumnGrid>
      </Container>
    </React.Fragment>
  );
};

export const SignedIn = compose(
  withCurrentUser,
  connect()
)(Component);
