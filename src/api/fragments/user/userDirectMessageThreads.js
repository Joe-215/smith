// @flow
// $FlowFixme
import { gql } from 'react-apollo';
import { directMessageThreadInfoFragment } from '../directMessageThread/directMessageThreadInfo';

export const userDirectMessageThreadsFragment = gql`
  fragment userDirectMessageThreads on User {
    directMessageThreadsConnection {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          ...directMessageThreadInfo
        }
      }
    }
  }
  ${directMessageThreadInfoFragment}
`;
