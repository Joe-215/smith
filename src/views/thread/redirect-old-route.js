// @flow
// Redirect the old thread route (/thread/:threadId) to the new one (/:community/:channel/:threadId)
import React from 'react';
import { Redirect } from 'react-router';
import slugg from 'slugg';
import idx from 'idx';
import { getThreadByMatch } from 'shared/graphql/queries/thread/getThread';
import { ErrorView, LoadingView } from 'src/views/viewHelpers';

export default getThreadByMatch(props => {
  const { data } = props;
  if (data) {
    const { thread, loading, error } = data;

    if (thread && thread.id) {
      return (
        <Redirect
          to={`/${thread.community.slug}/${thread.channel.slug}/${slugg(
            thread.content.title
          )}~${thread.id}${idx(props, _ => _.location.search) || ''}`}
        />
      );
    }

    if (loading) {
      return <LoadingView />;
    }

    // If we don't have a thread, but also aren't loading anymore it's either a private or a non-existant thread
    if (error) {
      return <ErrorView />;
    }

    return null;
  }

  return null;
});
