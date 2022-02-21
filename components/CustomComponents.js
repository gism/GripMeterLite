import React from 'react';
import {
    StyleSheet,
    Text,
    SafeAreaView,
    View,
    FlatList,
    TouchableOpacity,
    Modal,
    StatusBar,
  } from 'react-native';

import {styles} from '../Styles/styles';
export const Button = function (props) {
    const { onPress, title, ...restProps } = props;
    return (
      <TouchableOpacity onPress={onPress} {...restProps}>
        <Text
          style={[
            styles.buttonStyle,
            restProps.disabled ? styles.disabledButtonStyle : null,
          ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };