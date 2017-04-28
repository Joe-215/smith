// @flow
import React from 'react';
//$FlowFixMe
import compose from 'recompose/compose';
//$FlowFixMe
import pure from 'recompose/pure';
//$FlowFixMe
import renderComponent from 'recompose/renderComponent';
//$FlowFixMe
import branch from 'recompose/branch';
import StoryFeedCard from '../storyFeedCard';
import Loading from '../loading';
import { Button } from '../buttons';

const displayLoadingState = branch(
  props => props.data.loading,
  renderComponent(Loading)
);

const StoryFeedPure = ({ data: { user, loading, fetchMore }, data }) => {
  const stories = user.everything.edges;

  return (
    <div>
      {stories.map(story => {
        return <StoryFeedCard key={story.node.id} data={story.node} />;
      })}

      <Button onClick={fetchMore}>Fetch More</Button>
    </div>
  );
};

const StoryFeed = compose(displayLoadingState, pure)(StoryFeedPure);
export default StoryFeed;
