//@flow
import React from 'react';
// $FlowFixMe
import pure from 'recompose/pure';
import Icon from '../icons';
import { Meta, MetaList, MetaListItem, Label, Count } from './style';

/*
  Brian:
  Given the type of metadata we want to render, we need to hardcode a label and
  icon for the UI. A big if-return function like this feels messy, but is relatively
  easy to extend or modify as needed
*/
const buildArray = (meta: Object): Array<any> => {
  return Object.keys(meta).filter(item => item !== '__typename').map(item => {
    if (item === 'stories') {
      return Object.assign(
        {},
        {
          icon: 'edit',
          label: 'Stories',
          count: meta[item],
        }
      );
    }

    if (item === 'frequencies') {
      return Object.assign(
        {},
        {
          icon: 'emoji',
          label: 'Frequencies',
          count: meta[item],
        }
      );
    }

    if (item === 'subscribers') {
      return Object.assign(
        {},
        {
          icon: 'emoji',
          label: 'Subscribers',
          count: meta[item],
        }
      );
    }

    if (item === 'members') {
      return Object.assign(
        {},
        {
          icon: 'emoji',
          label: 'Members',
          count: meta[item],
        }
      );
    }
  });
};

const MetaDataPure = ({ data, type }) => {
  // determines if we are looking at a frequency, user, or community
  const meta = data[type].metaData;
  const arr = buildArray(meta);

  return (
    <Meta>
      <MetaList>
        {arr.map((item, i) => {
          return (
            <MetaListItem key={i}>
              <Label>
                <Icon
                  icon={item.icon}
                  color={'text.alt'}
                  hoverColor={'text.alt'}
                  scaleOnHover={false}
                  size={24}
                />
                {item.label}
              </Label>
              <Count>{item.count}</Count>
            </MetaListItem>
          );
        })}
      </MetaList>
    </Meta>
  );
};

export const MetaData = pure(MetaDataPure);
