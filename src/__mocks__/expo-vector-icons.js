import React from 'react';
import { Text } from 'react-native';

export const MaterialIcons = ({ name, ...props }) => <Text {...props}>{name}</Text>;
export const Ionicons = ({ name, ...props }) => <Text {...props}>{name}</Text>;
export const FontAwesome = ({ name, ...props }) => <Text {...props}>{name}</Text>;
export const AntDesign = ({ name, ...props }) => <Text {...props}>{name}</Text>;
export const Feather = ({ name, ...props }) => <Text {...props}>{name}</Text>;

export default {
  MaterialIcons,
  Ionicons,
  FontAwesome,
  AntDesign,
  Feather,
}; 