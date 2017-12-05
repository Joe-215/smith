// @flow
const debug = require('debug')('hermes:queue:send-new-message-email');
import sendEmail from '../send-email';
import { generateUnsubscribeToken } from '../utils/generate-jwt';
import {
  NEW_MESSAGE_TEMPLATE,
  TYPE_NEW_MESSAGE_IN_THREAD,
  TYPE_MUTE_THREAD,
  SEND_NEW_MESSAGE_EMAIL,
} from './constants';

type ReplyData = {
  sender: {
    name: string,
    username: string,
    profilePhoto: string,
  },
  content: {
    body: string,
  },
};

type ThreadData = {
  id: string,
  content: {
    title: string,
  },
  community: {
    slug: string,
    name: string,
  },
  channel: {
    name: string,
  },
  replies: Array<ReplyData>,
};

type SendNewMessageEmailJobData = {
  recipient: {
    id: string,
    email: string,
    username: string,
  },
  threads: Array<ThreadData>,
};

type SendNewMessageEmailJob = {
  data: SendNewMessageEmailJobData,
  id: string,
};

export default async (job: SendNewMessageEmailJob) => {
  debug(`\nnew job: ${job.id}`);
  const { recipient, threads } = job.data;

  // how many threads were grouped into this email
  const threadsAmount = threads.length;
  let totalNames = [];
  threads.map(thread => {
    const replyNames = thread.replies.map(reply => reply.sender.name);
    return replyNames.map(name => {
      totalNames.push(name);
      return name;
    });
  });
  // how many unique people sent replies in all of these threads
  totalNames = totalNames.filter((x, i, a) => a.indexOf(x) == i);
  const firstName = totalNames.splice(0, 1)[0];
  const restNames = totalNames.length > 0 ? totalNames : null;
  const numUsersText = restNames ? ` and ${restNames.length} others` : ' ';
  const threadsText =
    threadsAmount === 1
      ? `'${threads[0].content.title}'`
      : `${threadsAmount} conversations`;
  // Brian and 3 others replied in 4 conversations
  // Brian replied in 'Thread title'
  // Brian and 3 others replied in 'Thread title'
  const subject = `${firstName}${numUsersText} replied in ${threadsText}`;
  const preheaderSubtext = restNames
    ? ` and ${restNames.length} others...`
    : '';
  const preheader = `Reply to ${firstName}${preheaderSubtext}`;

  const unsubscribeToken = await generateUnsubscribeToken(
    recipient.id,
    TYPE_NEW_MESSAGE_IN_THREAD
  );

  if (!unsubscribeToken || !recipient.email || !recipient.username) return;
  try {
    return sendEmail({
      TemplateId: NEW_MESSAGE_TEMPLATE,
      To: recipient.email,
      Tag: SEND_NEW_MESSAGE_EMAIL,
      TemplateModel: {
        subject,
        preheader,
        recipient,
        unsubscribeToken,
        data: {
          threads: threads.map(thread => ({
            ...thread,
            muteThreadToken: generateUnsubscribeToken(
              recipient.id,
              TYPE_MUTE_THREAD,
              thread.id
            ),
          })),
        },
      },
    });
  } catch (err) {
    console.log(err);
  }
};
