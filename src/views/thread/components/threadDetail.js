// @flow
import React, { Component } from 'react';
// $FlowFixMe
import pure from 'recompose/pure';
// $FlowFixMe
import compose from 'recompose/compose';
// $FlowFixMe
import { connect } from 'react-redux';
// $FlowFixMe
import { withRouter } from 'react-router';
// $FlowFixMe
import { Link } from 'react-router-dom';
import { getLinkPreviewFromUrl, timeDifference } from '../../../helpers/utils';
import { URLS } from '../../../helpers/regexps';
import { openModal } from '../../../actions/modals';
import { addToastWithTimeout } from '../../../actions/toasts';
import { setThreadLockMutation } from '../mutations';
import { deleteThreadMutation, editThreadMutation } from '../../../api/thread';
import Icon from '../../../components/icons';
import Flyout from '../../../components/flyout';
import Badge from '../../../components/badges';
import { IconButton, Button } from '../../../components/buttons';
import { track } from '../../../helpers/events';
import Editor, {
  toJSON,
  toPlainText,
  toState,
} from '../../../components/editor';
import {
  LinkPreview,
  LinkPreviewLoading,
} from '../../../components/linkPreview';
import { ThreadTitle, ThreadDescription } from '../style';
// $FlowFixMe
import Textarea from 'react-textarea-autosize';
import Titlebar from '../../../views/titlebar';
import {
  ThreadWrapper,
  ThreadHeading,
  Byline,
  ThreadContent,
  ContextRow,
  DropWrap,
  FlyoutRow,
  EditDone,
  Edited,
  BylineMeta,
  AuthorAvatar,
  AuthorName,
  AuthorUsername,
  Location,
} from '../style';

class ThreadDetailPure extends Component {
  state: {
    isEditing: boolean,
    viewBody: string,
    editBody: string,
    title: string,
    linkPreview: Object,
    linkPreviewTrueUrl: string,
    linkPreviewLength: number,
    fetchingLinkPreview: boolean,
    isSavingEdit: boolean,
  };

  constructor(props) {
    super(props);

    const { thread } = props;

    let rawLinkPreview = thread.attachments && thread.attachments.length > 0
      ? thread.attachments.filter(
          attachment => attachment.attachmentType === 'linkPreview'
        )[0]
      : null;

    let cleanLinkPreview = rawLinkPreview && {
      attachmentType: rawLinkPreview.attachmentType,
      data: JSON.parse(rawLinkPreview.data),
    };

    const viewBody = thread.type === 'SLATE'
      ? toPlainText(toState(JSON.parse(thread.content.body)))
      : thread.content.body;

    const editBody = thread.type === 'SLATE'
      ? toState(JSON.parse(thread.content.body))
      : thread.content.body;

    this.state = {
      isEditing: false,
      viewBody,
      editBody,
      title: thread.content.title,
      linkPreview: rawLinkPreview ? cleanLinkPreview.data : null,
      linkPreviewTrueUrl: thread.attachments.length > 0
        ? thread.attachments[0].trueUrl
        : '',
      linkPreviewLength: thread.attachments.length > 0 ? 1 : 0,
      fetchingLinkPreview: false,
      flyoutOpen: false,
      isSavingEdit: false,
    };
  }

  toggleFlyout = () => {
    if (this.state.flyoutOpen === false) {
      this.setState({ flyoutOpen: true });
    } else {
      this.setState({ flyoutOpen: false });
    }
  };

  threadLock = () => {
    const { setThreadLock, dispatch, thread } = this.props;
    const value = !thread.isLocked;
    const threadId = thread.id;

    setThreadLock({
      threadId,
      value,
    })
      .then(({ data: { setThreadLock } }) => {
        if (setThreadLock.isLocked) {
          track('thread', 'locked', null);
          dispatch(addToastWithTimeout('neutral', 'Thread locked.'));
        } else {
          track('thread', 'unlocked', null);
          dispatch(addToastWithTimeout('success', 'Thread unlocked!'));
        }
      })
      .catch(err => {
        dispatch(addToastWithTimeout('error', err.message));
      });
  };

  triggerDelete = e => {
    e.preventDefault();
    const { thread, dispatch } = this.props;

    track('thread', 'delete inited', null);

    const threadId = thread.id;
    const isChannelOwner = thread.channel.channelPermissions.isOwner;
    const isCommunityOwner =
      thread.channel.community.communityPermissions.isOwner;

    let message;

    if (isCommunityOwner && !thread.isCreator) {
      message = `You are about to delete another person's thread. As the owner of the ${thread.channel.community.name} community, you have permission to do this. The thread creator will be notified that this thread was deleted.`;
    } else if (isChannelOwner && !thread.isCreator) {
      message = `You are about to delete another person's thread. As the owner of the ${thread.channel} channel, you have permission to do this. The thread creator will be notified that this thread was deleted.`;
    } else if (thread.isCreator) {
      message = 'Are you sure you want to delete this thread?';
    } else {
      message = 'Are you sure you want to delete this thread?';
    }

    return dispatch(
      openModal('DELETE_DOUBLE_CHECK_MODAL', {
        id: threadId,
        entity: 'thread',
        message,
      })
    );
  };

  toggleEdit = () => {
    const { isEditing } = this.state;
    this.setState({
      isEditing: !isEditing,
    });
  };

  saveEdit = () => {
    const { dispatch, editThread, thread } = this.props;
    const { linkPreview, linkPreviewTrueUrl, title, editBody } = this.state;
    const threadId = thread.id;

    if (!title || title.length === 0) {
      dispatch(
        addToastWithTimeout('error', 'Be sure to save a title for your thread!')
      );
      return;
    }

    this.setState({
      isSavingEdit: true,
    });

    const attachments = [];
    if (linkPreview) {
      const attachmentData = JSON.stringify({
        ...linkPreview,
        trueUrl: linkPreviewTrueUrl,
      });
      attachments.push({
        attachmentType: 'linkPreview',
        data: attachmentData,
      });
    }

    let bodyToSave = editBody;
    if (thread.type === 'SLATE') {
      bodyToSave = JSON.stringify(toJSON(bodyToSave));
    }

    const content = {
      title,
      body: bodyToSave,
    };

    // Get the images
    const filesToUpload = editBody.document.nodes
      .filter(node => node.type === 'image')
      .map(image => image.getIn(['data', 'file']))
      .toJS();

    const input = {
      threadId,
      content,
      attachments,
      filesToUpload,
    };

    editThread(input)
      .then(({ data: { editThread } }) => {
        this.setState({
          isSavingEdit: false,
        });

        if (editThread && editThread !== null) {
          this.toggleEdit();
          dispatch(addToastWithTimeout('success', 'Thread saved!'));

          this.setState({
            viewBody: thread.type === 'SLATE'
              ? toPlainText(toState(JSON.parse(editThread.content.body)))
              : editThread.content.body,
          });
        } else {
          dispatch(
            addToastWithTimeout(
              'error',
              "We weren't able to save these changes. Try again?"
            )
          );
        }
      })
      .catch(err => {
        this.setState({
          isSavingEdit: false,
        });
        dispatch(addToastWithTimeout('error', err.message));
      });
  };

  changeTitle = e => {
    const title = e.target.value;
    if (/\n$/g.test(title)) {
      this.bodyEditor.focus();
      return;
    }
    this.setState({
      title,
    });
  };

  changeBody = state => {
    this.setState({
      editBody: state,
    });
  };

  listenForUrl = (e, data, state) => {
    const text = toPlainText(state);

    if (
      e.keyCode !== 8 &&
      e.keyCode !== 9 &&
      e.keyCode !== 13 &&
      e.keyCode !== 32 &&
      e.keyCode !== 46
    ) {
      // Return if backspace, tab, enter, space or delete was not pressed.
      return;
    }

    const { linkPreview, linkPreviewLength } = this.state;

    // also don't check if we already have a url in the linkPreview state
    if (linkPreview !== null) return;

    const toCheck = text.match(URLS);

    if (toCheck) {
      const len = toCheck.length;
      if (linkPreviewLength === len) return; // no new links, don't recheck

      let urlToCheck = toCheck[len - 1].trim();

      this.setState({ fetchingLinkPreview: true });

      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = 'https://' + urlToCheck;
      }

      getLinkPreviewFromUrl(urlToCheck)
        .then(data => {
          // this.props.dispatch(stopLoading());

          this.setState(prevState => ({
            linkPreview: { ...data, trueUrl: urlToCheck },
            linkPreviewTrueUrl: urlToCheck,
            linkPreviewLength: prevState.linkPreviewLength + 1,
            fetchingLinkPreview: false,
            error: null,
          }));

          const linkPreview = {};
          linkPreview['data'] = data;
          linkPreview['trueUrl'] = urlToCheck;

          // this.props.dispatch(addLinkPreview(linkPreview));
        })
        .catch(err => {
          this.setState({
            error: "Oops, that URL didn't seem to want to work. You can still publish your story anyways 👍",
            fetchingLinkPreview: false,
          });
        });
    }
  };

  removeLinkPreview = () => {
    this.setState({
      linkPreview: null,
      linkPreviewTrueUrl: '',
    });
  };

  render() {
    const { currentUser, thread } = this.props;

    const {
      isEditing,
      linkPreview,
      linkPreviewTrueUrl,
      viewBody,
      fetchingLinkPreview,
      flyoutOpen,
      isSavingEdit,
    } = this.state;

    const isChannelOwner = thread.channel.channelPermissions.isOwner;
    const isCommunityOwner =
      thread.channel.community.communityPermissions.isOwner;

    const isEdited = thread.modifiedAt;
    const editedTimestamp = isEdited
      ? new Date(thread.modifiedAt).getTime()
      : null;

    return (
      <ThreadWrapper>
        <ContextRow>
          <Byline to={`/users/${thread.creator.username}`}>
            <AuthorAvatar
              size={48}
              radius={48}
              onlineSize={'large'}
              isOnline={thread.creator.isOnline}
              src={thread.creator.profilePhoto}
            />
            <BylineMeta>
              <AuthorName>{thread.creator.name}</AuthorName>
              <AuthorUsername>
                @{thread.creator.username}
                {thread.creator.isAdmin && <Badge type="admin" />}
                {thread.creator.isPro && <Badge type="pro" />}
              </AuthorUsername>
            </BylineMeta>
          </Byline>
          {currentUser &&
            (thread.isCreator || isChannelOwner || isCommunityOwner) &&
            !isEditing &&
            <DropWrap className={flyoutOpen ? 'open' : ''}>
              <IconButton glyph="settings" onClick={this.toggleFlyout} />
              <Flyout>
                {(isChannelOwner || isCommunityOwner) &&
                  <FlyoutRow>
                    <IconButton
                      glyph="freeze"
                      hoverColor="space.light"
                      tipText={
                        thread.isLocked ? 'Unfreeze chat' : 'Freeze chat'
                      }
                      tipLocation="top-left"
                      onClick={this.threadLock}
                    />
                  </FlyoutRow>}
                {(thread.isCreator || isChannelOwner || isCommunityOwner) &&
                  <FlyoutRow>
                    <IconButton
                      glyph="delete"
                      hoverColor="warn.alt"
                      tipText="Delete thread"
                      tipLocation="top-left"
                      onClick={this.triggerDelete}
                    />
                  </FlyoutRow>}
                {thread.isCreator &&
                  thread.type === 'SLATE' &&
                  <FlyoutRow>
                    <IconButton
                      glyph="edit"
                      hoverColor="text.alt"
                      tipText="Edit"
                      tipLocation="top-left"
                      onClick={this.toggleEdit}
                    />
                  </FlyoutRow>}
              </Flyout>
            </DropWrap>}

          {isEditing &&
            <EditDone>
              <Button loading={isSavingEdit} onClick={this.saveEdit}>
                Save
              </Button>
            </EditDone>}
        </ContextRow>

        {!isEditing &&
          <span>
            <Location>
              <Icon glyph="view-back" size={16} />
              <Link to={`/${thread.channel.community.slug}`}>
                {thread.channel.community.name}
              </Link>
              <span>/</span>
              <Link
                to={`/${thread.channel.community.slug}/${thread.channel.slug}`}
              >
                {thread.channel.name}
              </Link>
            </Location>
            <ThreadHeading>
              {thread.content.title}
            </ThreadHeading>
            {thread.modifiedAt &&
              <Edited>
                Edited {timeDifference(Date.now(), editedTimestamp)}
              </Edited>}
            <div className="markdown">
              <ThreadContent>
                {viewBody}
              </ThreadContent>
            </div>

            {linkPreview &&
              !fetchingLinkPreview &&
              <LinkPreview
                trueUrl={linkPreview.url}
                data={linkPreview}
                size={'large'}
                editable={false}
                margin={'16px 0 0 0'}
              />}
          </span>}

        {isEditing &&
          <span>
            <Textarea
              onChange={this.changeTitle}
              style={ThreadTitle}
              value={this.state.title}
              placeholder={'A title for your thread...'}
              ref="titleTextarea"
              autoFocus
            />

            <Editor
              onChange={this.changeBody}
              onKeyDown={this.listenForUrl}
              state={this.state.editBody}
              style={ThreadDescription}
              ref="bodyTextarea"
              editorRef={editor => this.bodyEditor = editor}
              placeholder="Write more thoughts here, add photos, and anything else!"
              showLinkPreview={true}
              linkPreview={{
                loading: fetchingLinkPreview,
                remove: this.removeLinkPreview,
                trueUrl: linkPreviewTrueUrl,
                data: linkPreview,
              }}
            />

          </span>}
      </ThreadWrapper>
    );
  }
}

const ThreadDetail = compose(
  setThreadLockMutation,
  deleteThreadMutation,
  editThreadMutation,
  withRouter,
  pure
)(ThreadDetailPure);
const mapStateToProps = state => ({
  currentUser: state.users.currentUser,
  flyoutOpen: state.flyoutOpen,
});
export default connect(mapStateToProps)(ThreadDetail);
