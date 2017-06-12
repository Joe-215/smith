// @flow
// $FlowFixMe
import UserError from '../utils/UserError';
import { getChannels } from '../models/channel';
import { getCommunities } from '../models/community';
import { getUserPermissionsInChannel } from '../models/usersChannels';
import { getUserPermissionsInCommunity } from '../models/usersCommunities';
import {
  createParticipantInThread,
  createNotifiedUserInThread,
  getThreadNotificationStatusForUser,
  updateThreadNotificationStatusForUser,
} from '../models/usersThreads';
const {
  getThread,
  getThreads,
  publishThread,
  deleteThread,
  setThreadLock,
  editThread,
  updateThreadWithImages,
} = require('../models/thread');
const { uploadImage } = require('../utils/s3');

module.exports = {
  Mutation: {
    publishThread: (_, { thread }, { user }) => {
      const currentUser = user;

      // user must be authed to publish a thread
      if (!currentUser) {
        return new UserError('You must be signed in to publish a new thread.');
      }

      // get the current user's permissions in the channel where the thread is being posted
      const currentUserChannelPermissions = getUserPermissionsInChannel(
        thread.channelId,
        currentUser.id
      );

      // get the channel object where the thread is being posted
      const channels = getChannels([thread.channelId]);

      return Promise.all([currentUserChannelPermissions, channels])
        .then(([currentUserChannelPermissions, channels]) => {
          // select the channel to evaluate
          const channelToEvaluate = channels[0];

          // if channel wasn't found
          if (!channelToEvaluate || channelToEvaluate.deletedAt) {
            return new UserError("This channel doesn't exist");
          }

          // if user isn't a channel member
          if (!currentUserChannelPermissions.isMember) {
            return new UserError(
              "You don't have permission to create threads in this channel."
            );
          }

          // if the thread has attachments, we recreate an array with a JSON.parsed
          // data value (comes in from the client as a string in order to have dynamic
          // data shapes without overcomplicating the gql schema)
          let attachments = [];
          // if the thread came in with attachments
          if (thread.attachments) {
            // iterate through them and construct a new attachment object
            thread.attachments.map(attachment => {
              attachments.push({
                attachmentType: attachment.attachmentType,
                data: JSON.parse(attachment.data),
              });
            });

            const newThread = Object.assign({}, thread, {
              attachments,
            });

            // publish the thread
            return publishThread(newThread, currentUser.id).then(thread => {
              // create a relationship between the thread author and the thread
              createParticipantInThread(thread.id, currentUser.id);
              return thread;
            });
          } else {
            // if no attachments were passed into the thread, we can just publish
            // as-is
            // publish the thread
            return publishThread(newThread, currentUser.id).then(thread => {
              // create a relationship between the thread author and the thread
              createParticipantInThread(thread.id, currentUser.id);
              return thread;
            });
          }
        })
        .then(newThread => {
          if (thread.filesToUpload) {
            // iterate over files and upload
            // array of image urls
            // update the content.body of the thread
            return Promise.all([
              newThread,
              Promise.all(
                thread.filesToUpload.map(file =>
                  uploadImage(file, 'threads', newThread.id)
                )
              ),
            ]);
          } else {
            return Promise.all([newThread]);
          }
        })
        .then(([newThread, urls]) => {
          if (!urls) return newThread;

          const slateState = JSON.parse(newThread.content.body);
          let fileIndex = 0;
          const newSlateState = {
            ...slateState,
            nodes: slateState.nodes.map(node => {
              if (node.type !== 'image') return node;
              fileIndex++;
              return {
                kind: 'block',
                type: 'paragraph',
                nodes: [
                  {
                    kind: 'text',
                    text: `![](${urls[fileIndex - 1]})`,
                  },
                ],
              };
            }),
          };

          return updateThreadWithImages(
            newThread.id,
            JSON.stringify(newSlateState)
          );
        });
    },
    editThread: (_, { input }, { user }) => {
      const currentUser = user;

      // user must be authed to edit a thread
      if (!currentUser) {
        return new UserError(
          'You must be signed in to make changes to this thread.'
        );

      return getThreads([input.threadId])
        .then(threads => {
          // select the thread
          const thread = threads[0];

          // if the thread doesn't exist
          if (!thread) {
            return new UserError("This thread doesn't exist");
          }

          // only the thread creator can edit the thread
          if (thread.creatorId !== currentUser.id) {
            return new UserError(
              "You don't have permission to make changes to this thread."
            );
          }

          // if the thread has attachments, we recreate an array with a JSON.parsed
          // data value (comes in from the client as a string in order to have dynamic
          // data shapes without overcomplicating the gql schema)
          let attachments = [];
          // if the thread came in with attachments
          if (input.attachments) {
            // iterate through them and construct a new attachment object
            input.attachments.map(attachment => {
              attachments.push({
                attachmentType: attachment.attachmentType,
                data: JSON.parse(attachment.data),
              });
            });

            const newInput = Object.assign({}, input, {
              attachments,
            });

            return editThread(newInput);
          } else {
            // if no attachments were passed into the thread, we can just publish
            // as-is
            return editThread(input);
          }
        })
        .then(editedThread => {
          if (!input.filesToUpload) return Promise.all([editedThread]);

          return Promise.all([
            editedThread,
            Promise.all(
              input.filesToUpload.map(file =>
                uploadImage(file, 'threads', editedThread.id)
              )
            ),
          ]);
        })
        .then(([editedThread, urls]) => {
          if (!urls) return editedThread;

          const slateState = JSON.parse(editedThread.content.body);
          let fileIndex = 0;
          const newSlateState = {
            ...slateState,
            nodes: slateState.nodes.map(node => {
              if (node.type !== 'image') return node;
              fileIndex++;
              return {
                kind: 'block',
                type: 'paragraph',
                nodes: [
                  {
                    kind: 'text',
                    text: `![](${urls[fileIndex - 1]})`,
                  },
                ],
              };
            }),
          };

          return updateThreadWithImages(
            editedThread.id,
            JSON.stringify(newSlateState)
          );
        });
    },
    deleteThread: (_, { threadId }, { user }) => {
      const currentUser = user;

      // user must be authed to edit a thread
      if (!currentUser) {
        return new UserError(
          'You must be signed in to make changes to this thread.'
        );
      }

      // get the thread being locked
      return getThreads([threadId])
        .then(threads => {
          // select the thread
          const threadToEvaluate = threads[0];

          // if the thread doesn't exist
          if (!threadToEvaluate || threadToEvaluate.deletedAt) {
            return new UserError("This thread doesn't exist");
          }

          // get the channel permissions
          const currentUserChannelPermissions = getUserPermissionsInChannel(
            threadToEvaluate.channelId,
            currentUser.id
          );
          // get the community permissions
          const currentUserCommunityPermissions = getUserPermissionsInCommunity(
            threadToEvaluate.communityId,
            currentUser.id
          );

          // return the thread, channels and communities
          return Promise.all([
            threadToEvaluate,
            currentUserChannelPermissions,
            currentUserCommunityPermissions,
          ]);
        })
        .then(([
          thread,
          currentUserChannelPermissions,
          currentUserCommunityPermissions,
        ]) => {
          // user owns the community or the channel, they can lock the thread
          if (
            currentUserChannelPermissions.isOwner ||
            currentUserChannelPermissions.isModerator ||
            currentUserCommunityPermissions.isOwner ||
            currentUserCommunityPermissions.isModerator ||
            thread.creatorId === currentUser.id
          ) {
            return deleteThread(threadId);
          }

          // if the user is not a channel or community owner, the thread can't be locked
          return new UserError(
            "You don't have permission to make changes to this thread."
          );
        });
    },
    setThreadLock: (_, { threadId, value }, { user }) => {
      const currentUser = user;

      // user must be authed to edit a thread
      if (!currentUser) {
        return new UserError(
          'You must be signed in to make changes to this thread.'
        );
      }

      // get the thread being locked
      return getThreads([threadId])
        .then(threads => {
          // select the thread
          const threadToEvaluate = threads[0];

          // if the thread doesn't exist
          if (!threadToEvaluate || threadToEvaluate.deletedAt) {
            return new UserError("This thread doesn't exist");
          }

          // get the channel permissions
          const currentUserChannelPermissions = getUserPermissionsInChannel(
            threadToEvaluate.channelId,
            currentUser.id
          );
          // get the community permissions
          const currentUserCommunityPermissions = getUserPermissionsInCommunity(
            threadToEvaluate.communityId,
            currentUser.id
          );

          // return the thread, channels and communities
          return Promise.all([
            threadToEvaluate,
            currentUserChannelPermissions,
            currentUserCommunityPermissions,
          ]);
        })
        .then(([
          thread,
          currentUserChannelPermissions,
          currentUserCommunityPermissions,
        ]) => {
          // user owns the community or the channel, they can lock the thread
          if (
            currentUserChannelPermissions.isOwner ||
            currentUserChannelPermissions.isModerator ||
            currentUserCommunityPermissions.isOwner ||
            currentUserCommunityPermissions.isModerator
          ) {
            return setThreadLock(threadId, value);
          }

          // if the user is not a channel or community owner, the thread can't be locked
          return new UserError(
            "You don't have permission to make changes to this thread."
          );
        });
    },
    toggleThreadNotifications: (_, { threadId }, { user }) => {
      const currentUser = user;

      // user must be authed to edit a thread
      if (!currentUser) {
        return new UserError(
          'You must be signed in to toggle notifications on this thread.'
        );
      }

      // check to see if a relationship between this user and this thread exists
      return getThreadNotificationStatusForUser(threadId, currentUser.id)
        .then(thread => {
          const threadToEvaluate = thread;
          if (thread && thread.length > 0) {
            // a relationship with this thread exists, we are going to update it
            let value;
            if (thread[0].receiveNotifications) {
              // if they are currently receiving notifications, turn them off
              value = false;
              return updateThreadNotificationStatusForUser(
                threadId,
                currentUser.id,
                value
              );
            } else {
              // if they aren't receiving notifications, turn them on
              value = true;
              return updateThreadNotificationStatusForUser(
                threadId,
                currentUser.id,
                value
              );
            }
          } else {
            // if a relationship doesn't exist, create a new one
            return createNotifiedUserInThread(threadId, currentUser.id);
          }
        })
        .then(() => getThread(threadId));
    },
  },
};
