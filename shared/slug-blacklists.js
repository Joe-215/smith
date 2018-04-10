/**
 * This file is shared between server and client.
 * ⚠️ DON'T PUT ANY NODE.JS OR BROWSER-SPECIFIC CODE IN HERE ⚠️
 */

var COMMUNITY_SLUG_BLACKLIST = [
  'about',
  'admin',
  'api',
  'apps',
  'blog',
  'business',
  'channelsettings',
  'channelview',
  'communityloginview',
  'communitysettings',
  'communityview',
  'contact',
  'cookies',
  'copyright',
  'dashboard',
  'developers',
  'directmessages',
  'discover',
  'downgrade',
  'errorfallback',
  'everything',
  'explore',
  'faq',
  'help',
  'home',
  'jobs',
  'legal',
  'login',
  'logout',
  'messages',
  'new',
  'newcommunity',
  'notifications',
  'null',
  'pages',
  'pricing',
  'privacy',
  'pro',
  'profile',
  'search',
  'security',
  'share',
  'shop',
  'status',
  'support',
  'team',
  'terms',
  'thread',
  'undefined',
  'upgrade',
  'usersettings',
  'userview',
];

var CHANNEL_SLUG_BLACKLIST = ['feed', 'members', 'settings'];

module.exports = {
  COMMUNITY_SLUG_BLACKLIST: COMMUNITY_SLUG_BLACKLIST,
  CHANNEL_SLUG_BLACKLIST: CHANNEL_SLUG_BLACKLIST,
};
